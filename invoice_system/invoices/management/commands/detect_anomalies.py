from django.core.management.base import BaseCommand
import pandas as pd
from sklearn.ensemble import IsolationForest
from invoices.models import Invoice

class Command(BaseCommand):
    help = 'Detect anomalous invoices using Isolation Forest'

    def handle(self, *args, **options):
        invoices = Invoice.objects.all()
        if not invoices.exists():
            self.stdout.write(self.style.ERROR('No invoices found.'))
            return

        data = [{'id': inv.id, 'total': float(inv.total)} for inv in invoices]
        df = pd.DataFrame(data)

        model = IsolationForest(contamination=0.05, random_state=42)
        df['anomaly'] = model.fit_predict(df[['total']])

        anomalies = df[df['anomaly'] == -1]
        if anomalies.empty:
            self.stdout.write(self.style.SUCCESS('No anomalies detected.'))
        else:
            self.stdout.write(self.style.WARNING('Anomalous invoices:'))
            for _, row in anomalies.iterrows():
                self.stdout.write(f"Invoice ID: {row['id']}, Total: ₹{row['total']:.2f}") 