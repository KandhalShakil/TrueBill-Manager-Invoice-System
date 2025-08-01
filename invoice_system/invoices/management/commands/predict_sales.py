from django.core.management.base import BaseCommand
import pandas as pd
from sklearn.linear_model import LinearRegression
from invoices.models import Invoice
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Predict future sales using linear regression'

    def handle(self, *args, **options):
        # Prepare data: get created_at and total for each invoice
        invoices = Invoice.objects.all().order_by('created_at')
        if not invoices.exists():
            self.stdout.write(self.style.ERROR('No invoices found.'))
            return

        data = []
        for inv in invoices:
            data.append({
                'date': inv.created_at,
                'total': float(inv.total)
            })
        df = pd.DataFrame(data)
        df['date_ordinal'] = df['date'].map(datetime.toordinal)

        # Train model
        X = df[['date_ordinal']]
        y = df['total']
        model = LinearRegression()
        model.fit(X, y)

        # Predict next 7 days
        last_date = df['date'].max()
        self.stdout.write('Predicted sales for next 7 days:')
        for i in range(1, 8):
            future_date = last_date + timedelta(days=i)
            pred = model.predict([[future_date.toordinal()]])
            self.stdout.write(f"{future_date.date()}: ₹{pred[0]:.2f}") 