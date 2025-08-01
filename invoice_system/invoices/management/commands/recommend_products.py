from django.core.management.base import BaseCommand
from invoices.models import InvoiceItem

class Command(BaseCommand):
    help = 'Recommend top-selling products'

    def handle(self, *args, **options):
        # Aggregate sales by product
        sales = {}
        for item in InvoiceItem.objects.all():
            name = item.item.name
            sales[name] = sales.get(name, 0) + item.quantity

        top_products = sorted(sales.items(), key=lambda x: x[1], reverse=True)[:5]
        self.stdout.write('Top 5 Recommended Products:')
        for name, qty in top_products:
            self.stdout.write(f"{name}: Sold {qty} times") 