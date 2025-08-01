from rest_framework import serializers
from .models import Invoice, InvoiceItem, InvoiceSequence, Customer
from items.models import Item
from decimal import Decimal
import logging
from django.db import transaction, IntegrityError
from django.utils import timezone

logger = logging.getLogger(__name__)

class InvoiceItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), 
        source='item', 
        write_only=True
    )
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ['id', 'item_name', 'item_id', 'quantity', 'price']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

    def validate(self, data):
        item = data.get('item')
        quantity = data.get('quantity', 0)
        
        if item and quantity > item.stock:
            raise serializers.ValidationError(f"Insufficient stock. Available: {item.stock}, Requested: {quantity}")
        
        return data

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    status = serializers.CharField(read_only=False, required=False)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['bill_number', 'subtotal', 'tax', 'discount', 'total', 'pdf']

    def validate(self, data):
        logger.info(f"Validating invoice data: {data}")
        return data

    def create(self, validated_data):
        try:
            items_data = self.context['request'].data.get('items', [])
            logger.info(f"Items data: {items_data}")

            # Generate bill number
            today = timezone.now().date()
            
            # Ensure the sequence for today exists.
            try:
                InvoiceSequence.objects.create(date=today)
            except IntegrityError:
                # The sequence for today already exists, which is expected.
                pass

            with transaction.atomic():
                # Now lock the sequence row and increment the number.
                sequence = InvoiceSequence.objects.select_for_update().get(date=today)
                sequence.last_number += 1
                sequence.save()
                
                bill_number = f"INV-{today.strftime('%Y%m%d')}-{sequence.last_number:03d}"

                validated_data['bill_number'] = bill_number
                # Set default values for required decimal fields
                validated_data.setdefault('subtotal', Decimal('0.00'))
                validated_data.setdefault('tax', Decimal('0.00'))
                validated_data.setdefault('discount', Decimal('0.00'))
                validated_data.setdefault('total', Decimal('0.00'))
                invoice = Invoice.objects.create(**validated_data)

                # Calculate totals
                subtotal = Decimal('0.00')
                for item_data in items_data:
                    item_id = item_data.get('item_id')
                    quantity = item_data.get('quantity')
                    
                    try:
                        item = Item.objects.get(id=item_id)
                    except Item.DoesNotExist:
                        raise serializers.ValidationError(f"Item with id {item_id} does not exist.")

                    if quantity > item.stock:
                        raise serializers.ValidationError(f"Insufficient stock for item {item.name}. Available: {item.stock}, Requested: {quantity}")

                    price = item.price
                    
                    logger.info(f"Creating invoice item: item={item.name}, quantity={quantity}, price={price}")
                    
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        item=item,
                        quantity=quantity,
                        price=price
                    )
                    
                    subtotal += Decimal(str(quantity)) * price
                    # Update stock
                    item.stock -= quantity
                    item.save()
                
                # Apply tax (5%) and discount (2%)
                tax = subtotal * Decimal('0.05')
                discount = subtotal * Decimal('0.02')
                total = subtotal + tax - discount
                
                invoice.subtotal = subtotal
                invoice.tax = tax
                invoice.discount = discount
                invoice.total = total
                
                # Generate PDF
                from .utils import generate_invoice_pdf
                pdf_path = generate_invoice_pdf(invoice)
                invoice.pdf = pdf_path
                
                invoice.save()
                logger.info(f"Invoice created successfully: {invoice.bill_number}")
                return invoice
        except Exception as e:
            logger.error(f"Error creating invoice: {str(e)}")
            raise serializers.ValidationError(f"Error creating invoice: {str(e)}") 

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__' 