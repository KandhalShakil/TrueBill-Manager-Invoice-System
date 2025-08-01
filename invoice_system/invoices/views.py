from django.shortcuts import render
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.db.models import Sum, Count, Avg
from datetime import datetime, date
from django.db import transaction, IntegrityError
from django.utils import timezone
from .models import Invoice, InvoiceItem, InvoiceSequence
from .serializers import InvoiceSerializer, InvoiceItemSerializer
from .utils import generate_invoice_pdf
import logging

from items.models import Item

logger = logging.getLogger(__name__)

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        bill_number = self.request.query_params.get('bill_number', None)
        customer_name = self.request.query_params.get('customer_name', None)
        if bill_number:
            queryset = queryset.filter(bill_number__icontains=bill_number)
        if customer_name:
            queryset = queryset.filter(customer_name__icontains=customer_name)
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Creating invoice with data: {request.data}")
            
            # Validate required fields
            customer_name = request.data.get('customer_name')
            customer_phone = request.data.get('customer_phone', '').strip()
            items_data = request.data.get('items', [])
            
            if not customer_name:
                return Response(
                    {'error': 'Customer name is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not items_data:
                return Response(
                    {'error': 'At least one item is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate bill number correctly
            today = timezone.now().date()
            try:
                InvoiceSequence.objects.create(date=today)
            except IntegrityError:
                pass  # Sequence for today already exists.

            with transaction.atomic():
                sequence = InvoiceSequence.objects.select_for_update().get(date=today)
                sequence.last_number += 1
                sequence.save()
                bill_number = f"INV-{today.strftime('%Y%m%d')}-{sequence.last_number:03d}"

            # Find all previous pending invoices for this customer (by name and phone if provided)
            invoice_filter = {'customer_name': customer_name}
            if customer_phone:
                invoice_filter['customer_phone'] = customer_phone
            previous_pending_invoices = list(Invoice.objects.filter(status='pending', **invoice_filter))
            previous_pending_total = sum(float(inv.total) for inv in previous_pending_invoices)
            previous_pending_items = []
            for inv in previous_pending_invoices:
                for item in inv.items.all():
                    previous_pending_items.append({
                        'description': item.item.name,
                        'qty': item.quantity,
                        'price': float(item.price),
                        'total': float(item.price) * item.quantity,
                        'invoice_bill_number': inv.bill_number
                    })
            
            # Check for last paid invoice for thank you message (by name and phone if provided)
            paid_invoice_filter = {'customer_name': customer_name}
            if customer_phone:
                paid_invoice_filter['customer_phone'] = customer_phone
            last_paid_invoice = Invoice.objects.filter(status='paid', **paid_invoice_filter).order_by('-created_at').first()
            thank_you_message = None
            if last_paid_invoice:
                thank_you_message = f"Thank you for paying ₹{last_paid_invoice.total:.2f}"
            
            # Create invoice
            user = request.user
            invoice = Invoice.objects.create(
                customer_name=customer_name,
                customer_phone=customer_phone,
                bill_number=bill_number,
                shopkeeper_gst_number=getattr(user, 'gst_number', ''),
                shopkeeper_account_number=getattr(user, 'account_number', ''),
                shopkeeper_bank_name=getattr(user, 'bank_name', ''),
                shopkeeper_account_holder_name=getattr(user, 'account_holder_name', ''),
            )
            
            # Add items to invoice
            total_amount = 0
            for item_data in items_data:
                try:
                    item_id = item_data.get('item_id')
                    quantity = item_data.get('quantity', 1)
                    
                    if not item_id:
                        continue
                    
                    # Get item details
                    item = Item.objects.get(id=item_id)
                    
                    # Calculate item total
                    item_total = float(item.price) * quantity
                    total_amount += item_total
                    
                    # Create invoice item
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        item=item,
                        quantity=quantity,
                        price=item.price
                    )
                    
                    # Update item stock
                    item.stock = max(0, item.stock - quantity)
                    item.save()
                    
                except Item.DoesNotExist:
                    logger.error(f"Item with id {item_id} not found")
                    continue
                except Exception as e:
                    logger.error(f"Error processing item {item_id}: {str(e)}")
                    continue
            
            # Calculate totals for current invoice only
            subtotal = total_amount
            tax = subtotal * 0.05  # 5% tax
            discount = subtotal * 0.02  # 2% discount
            final_total = subtotal + tax - discount

            # If previous_pending_total exists, store it but do NOT add to final_total
            invoice.subtotal = subtotal
            invoice.tax = tax
            invoice.discount = discount
            invoice.total = final_total  # Only this invoice's total
            invoice.pending_amount = previous_pending_total  # Store previous pending separately
            invoice.thank_you_message = thank_you_message
            invoice.save()
            
            # Previous pending invoices will no longer be deleted.
            # for inv in previous_pending_invoices:
            #     inv.delete()
            
            logger.info(f"Invoice created successfully: {invoice.id}")
            
            # Return the created invoice
            serializer = self.get_serializer(invoice)
            response_data = serializer.data
            if previous_pending_total:
                response_data['pending_amount'] = previous_pending_total
            if thank_you_message:
                response_data['thank_you_message'] = thank_you_message
            if previous_pending_items:
                response_data['previous_pending_items'] = previous_pending_items
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            return Response(
                {'error': f'Error creating invoice: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def partial_update(self, request, *args, **kwargs):
        invoice = self.get_object()
        data = request.data
        logger.info(f"Partial update for invoice {invoice.id}: {data}")
        serializer = self.get_serializer(invoice, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        logger.info(f"Invoice {invoice.id} updated. New status: {serializer.data.get('status')}")

        # If this invoice is now paid, mark all previous pending invoices for this customer as paid
        if serializer.data.get('status') == 'paid':
            previous_pending = Invoice.objects.filter(
                customer_name=invoice.customer_name,
                customer_phone=invoice.customer_phone,
                status='pending',
                created_at__lt=invoice.created_at
            ).exclude(id=invoice.id)
            previous_pending.update(status='paid')

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        try:
            import os
            from django.conf import settings
            invoice = self.get_object()
            logger.info(f"Generating PDF for invoice {invoice.id}")

            # Generate PDF using the simplified utility function
            from .utils import generate_invoice_pdf
            pdf_path = generate_invoice_pdf(invoice)
            full_pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_path)

            # Read PDF file
            with open(full_pdf_path, 'rb') as pdf_file:
                response = HttpResponse(pdf_file.read(), content_type='application/pdf')
                response['Content-Disposition'] = f'inline; filename="invoice_{invoice.bill_number}.pdf"'
                return response

        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return Response(
                {'error': f'Error generating PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

def daily_sales_view(request):
    """Get daily sales statistics"""
    try:
        # Get date from query parameter or use today
        date_str = request.GET.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        else:
            target_date = date.today()
        
        # Get invoices for the specified date
        invoices = Invoice.objects.filter(
            created_at__date=target_date
        )
        
        # Calculate statistics
        total_sales = invoices.aggregate(Sum('total'))['total__sum'] or 0
        invoice_count = invoices.count()
        avg_invoice_value = invoices.aggregate(Avg('total'))['total__avg'] or 0
        
        # Get items sold
        items_sold = InvoiceItem.objects.filter(
            invoice__created_at__date=target_date
        ).aggregate(Sum('quantity'))['quantity__sum'] or 0
        
        # Get top selling items
        top_items = InvoiceItem.objects.filter(
            invoice__created_at__date=target_date
        ).values('item__name').annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('price')
        ).order_by('-total_quantity')[:5]
        
        return JsonResponse({
            'date': target_date.strftime('%Y-%m-%d'),
            'total_sales': float(total_sales),
            'invoice_count': invoice_count,
            'avg_invoice_value': float(avg_invoice_value),
            'items_sold': items_sold,
            'top_items': list(top_items)
        })
        
    except Exception as e:
        logger.error(f"Error getting daily sales: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)