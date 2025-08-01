from django.contrib import admin
from .models import Invoice, InvoiceItem, InvoiceSequence, Customer

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('bill_number', 'customer_name', 'total', 'created_at', 'status')
    inlines = [InvoiceItemInline]

admin.site.register(InvoiceSequence)
admin.site.register(Customer)