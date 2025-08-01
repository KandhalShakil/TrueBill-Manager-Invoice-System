from django.core.management.base import BaseCommand
import pandas as pd
from sklearn.cluster import KMeans
from invoices.models import Invoice

class Command(BaseCommand):
    help = 'Segment customers using KMeans clustering'

    def handle(self, *args, **options):
        invoices = Invoice.objects.all()
        if not invoices.exists():
            self.stdout.write(self.style.ERROR('No invoices found.'))
            return

        # Aggregate total spend per customer
        data = {}
        for inv in invoices:
            name = inv.customer_name or "Unknown"
            data[name] = data.get(name, 0) + float(inv.total)
        df = pd.DataFrame(list(data.items()), columns=['customer', 'total_spent'])

        if len(df) < 2:
            self.stdout.write(self.style.ERROR('Not enough customers for clustering.'))
            return

        kmeans = KMeans(n_clusters=2, random_state=42)
        df['segment'] = kmeans.fit_predict(df[['total_spent']])

        self.stdout.write('Customer Segments:')
        for _, row in df.iterrows():
            self.stdout.write(f"Customer: {row['customer']}, Total Spent: ₹{row['total_spent']:.2f}, Segment: {row['segment']}") 