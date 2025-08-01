from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from django.conf import settings

# Register custom fonts
font_path = os.path.join(settings.BASE_DIR, 'fonts', 'DejaVuSans.ttf')
pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
bold_font_path = os.path.join(settings.BASE_DIR, 'fonts', 'DejaVuSans-Bold.ttf')
if os.path.isfile(bold_font_path):
    pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', bold_font_path))
    BOLD_FONT = 'DejaVuSans-Bold'
else:
    BOLD_FONT = 'DejaVuSans'
    print(f"Warning: DejaVuSans-Bold.ttf not found at {bold_font_path}. Using regular font instead.")

def generate_invoice_pdf(invoice):
    try:
        pdf_dir = os.path.join(settings.MEDIA_ROOT, 'invoices')
        os.makedirs(pdf_dir, exist_ok=True)
        filename = f"invoice_{invoice.bill_number}.pdf"
        filepath = os.path.join(pdf_dir, filename)
        
        c = canvas.Canvas(filepath, pagesize=letter)
        width, height = letter

        # Colors
        gold_color = colors.gold
        dark_bg = colors.HexColor("#1A1A1A")
        text_color = colors.white
        subtle_text = colors.HexColor("#A9A9A9")

        c.setFillColor(dark_bg)
        c.rect(0, 0, width, height, fill=1, stroke=0)

        c.setFont("DejaVuSans", 36)
        c.setFillColor(colors.gold)
        c.drawString(0.5 * inch, height - 1 * inch, "Grocery Shop")
    

        # --- Invoice Info ---
        c.setFont("DejaVuSans", 10)
        c.setFillColor(text_color)
        c.drawString(0.5 * inch, height - 1.8 * inch, "Invoice To:")
        c.setFont("DejaVuSans", 11)
        c.setFillColor(gold_color)
        c.drawString(0.5 * inch, height - 2.0 * inch, invoice.customer_name)
        
        c.setFont("DejaVuSans", 10)
        c.setFillColor(subtle_text)
        c.drawString(0.5 * inch, height - 2.2 * inch, f"+{invoice.customer_phone}")
        
        c.drawRightString(width - 0.5 * inch, height - 2.0 * inch, invoice.created_at.strftime("%d. %B, %Y"))
        c.drawRightString(width - 0.5 * inch, height - 2.2 * inch, f"Invoice #{invoice.bill_number}")

        # --- Shopkeeper Info ---
        c.setFont("DejaVuSans", 10)
        c.setFillColor(subtle_text)
        y_shop = height - 2.6 * inch
        if getattr(invoice, 'shopkeeper_gst_number', None):
            c.drawString(0.5 * inch, y_shop, f"GST: {invoice.shopkeeper_gst_number}")
            y_shop -= 0.18 * inch
        if getattr(invoice, 'shopkeeper_account_number', None):
            c.drawString(0.5 * inch, y_shop, f"A/C: {invoice.shopkeeper_account_number}")
            y_shop -= 0.18 * inch
        if getattr(invoice, 'shopkeeper_bank_name', None):
            c.drawString(0.5 * inch, y_shop, f"Bank: {invoice.shopkeeper_bank_name}")
            y_shop -= 0.18 * inch
        if getattr(invoice, 'shopkeeper_account_holder_name', None):
            c.drawString(0.5 * inch, y_shop, f"A/C Holder: {invoice.shopkeeper_account_holder_name}")
            y_shop -= 0.18 * inch

        # --- Table ---
        y = height - 3.2 * inch
        c.setStrokeColor(gold_color)
        c.line(0.5 * inch, y, width - 0.5 * inch, y)
        y -= 0.3 * inch

        # Table Header
        c.setFont("DejaVuSans", 10)
        c.setFillColor(subtle_text)
        c.drawString(0.7 * inch, y, "No")
        c.drawString(1.5 * inch, y, "Description")
        c.drawRightString(width - 3.5 * inch, y, "Price")
        c.drawRightString(width - 2.5 * inch, y, "Qty")
        c.drawRightString(width - 1.0 * inch, y, "Total")
        y -= 0.2 * inch
        c.line(0.5 * inch, y, width - 0.5 * inch, y)
        y -= 0.3 * inch
        
        # Table Content
        c.setFont("DejaVuSans", 11)
        c.setFillColor(text_color)
        for i, item in enumerate(invoice.items.all()):
            c.drawString(0.7 * inch, y, str(i + 1))
            c.drawString(1.5 * inch, y, item.item.name)
            c.drawRightString(width - 3.5 * inch, y, f"₹{item.price:.2f}")
            c.drawRightString(width - 2.5 * inch, y, str(item.quantity))
            c.drawRightString(width - 1.0 * inch, y, f"₹{item.quantity * item.price:.2f}")
            y -= 0.3 * inch
        
        # --- Totals ---
        y -= 0.1 * inch
        c.line(width - 4.5 * inch, y, width - 0.5 * inch, y)
        y -= 0.3 * inch

        c.setFont("DejaVuSans", 10)
        c.setFillColor(subtle_text)
        c.drawRightString(width - 2.5 * inch, y, "Sub-Total:")
        c.drawRightString(width - 1.0 * inch, y, f"₹{invoice.subtotal:.2f}")
        y -= 0.3 * inch
        
        c.drawRightString(width - 2.5 * inch, y, "Tax (5%):")
        c.drawRightString(width - 1.0 * inch, y, f"₹{invoice.tax:.2f}")
        y -= 0.3 * inch

        c.drawRightString(width - 2.5 * inch, y, "Discount (2%):")
        c.drawRightString(width - 1.0 * inch, y, f"-₹{invoice.discount:.2f}")
        y -= 0.3 * inch

        if invoice.pending_amount > 0:
            c.setFillColor(colors.HexColor("#FF6347")) # Tomato Red for pending
            c.drawRightString(width - 2.5 * inch, y, "Previous Pending:")
            c.drawRightString(width - 1.0 * inch, y, f"₹{invoice.pending_amount:.2f}")
            y -= 0.3 * inch
            c.setFillColor(subtle_text)

        c.setFont("DejaVuSans", 14)
        c.setFillColor(gold_color)
        c.drawRightString(width - 2.5 * inch, y, "Total:")
        c.drawRightString(width - 1.0 * inch, y, f"₹{invoice.total:.2f}")
        y -= 0.5 * inch

        # --- Previous Pending Invoice Items Table ---
        from invoices.models import Invoice as InvoiceModel, InvoiceItem as InvoiceItemModel
        previous_invoices = InvoiceModel.objects.filter(
            customer_name=invoice.customer_name,
            customer_phone=invoice.customer_phone,
            status='pending',
            created_at__lt=invoice.created_at
        ).exclude(id=invoice.id)
        previous_items = []
        for prev_inv in previous_invoices:
            for item in prev_inv.items.all():
                previous_items.append({
                    'description': item.item.name,
                    'qty': item.quantity,
                    'price': item.price,
                    'total': item.quantity * item.price,
                    'bill_number': prev_inv.bill_number
                })
        show_pending_table = getattr(invoice, 'status', None) != 'paid'
        if previous_items and show_pending_table:
            c.setFont("DejaVuSans", 12)
            c.setFillColor(colors.HexColor("#FF6347"))
            c.drawString(0.5 * inch, y, "Previous Pending Invoice Items")
            y -= 0.25 * inch
            c.setFillColor(gold_color)
            c.line(0.5 * inch, y, width - 0.5 * inch, y)
            y -= 0.2 * inch
            c.setFont("DejaVuSans", 10)
            c.setFillColor(subtle_text)
            # Define X positions for each column
            x_no = 0.7 * inch
            x_desc = 1.5 * inch
            x_price = 3.7 * inch
            x_qty = 5.0 * inch
            x_total = 5.7 * inch
            x_bill = 6.7 * inch
            # Table header
            c.drawString(x_no, y, "No")
            c.drawString(x_desc, y, "Description")
            c.drawString(x_price, y, "Price")
            c.drawString(x_qty, y, "Qty")
            c.drawString(x_total, y, "Total")
            c.drawString(x_bill, y, "Bill #")
            y -= 0.2 * inch
            c.setFillColor(text_color)
            c.setFont("DejaVuSans", 10)
            for i, item in enumerate(previous_items):
                c.drawString(x_no, y, str(i + 1))
                c.setFont(BOLD_FONT, 10)
                c.drawString(x_desc, y, item['description'])
                c.setFont("DejaVuSans", 10)
                c.drawString(x_price, y, f"₹{item['price']:.2f}")
                c.drawString(x_qty, y, str(item['qty']))
                c.drawString(x_total, y, f"₹{item['total']:.2f}")
                c.drawString(x_bill, y, item['bill_number'])
                y -= 0.22 * inch
            y -= 0.2 * inch
            c.setFillColor(gold_color)
            c.line(0.5 * inch, y, width - 0.5 * inch, y)
            y -= 0.2 * inch

        # --- Footer ---
        y = 2.0 * inch
        c.setFont("DejaVuSans", 24)
        c.setFillColor(gold_color)
        c.drawString(0.5 * inch, y, "Thank You")

        # If paid, show thank you for payment
        if getattr(invoice, 'status', None) == 'paid':
            c.setFont("DejaVuSans", 14)
            c.setFillColor(colors.green)
            c.drawString(0.5 * inch, y + 0.5 * inch, f"Thank you for paying ₹{invoice.total:.2f}")

        c.setFont("DejaVuSans", 10)
        c.setFillColor(subtle_text)
        c.drawString(0.5 * inch, y - 0.4 * inch, "Has made a purchase at our store. We")
        c.drawString(0.5 * inch, y - 0.6 * inch, "hope you are satisfied with our service.")
        
        c.drawRightString(width - 0.5 * inch, y - 0.5 * inch, "Kandhal Shakil")
        c.line(width - 2.0 * inch, y - 0.55 * inch, width - 0.5 * inch, y - 0.55 * inch)
        c.drawRightString(width - 0.5 * inch, y - 0.7 * inch, "Cashier")

        c.save()
        return f"invoices/{filename}"
    except Exception as e:
        raise
    
    