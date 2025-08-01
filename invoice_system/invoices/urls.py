from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_customer import CustomerViewSet

router = DefaultRouter()
router.register(r'items', views.ItemViewSet)
router.register(r'invoices', views.InvoiceViewSet)
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('daily-sales/', views.daily_sales_view, name='daily-sales'),
] 