from django.urls import path
from . import views

urlpatterns = [
    path('all/', views.get_all_tickets, name='get_all_tickets'),
    path('', views.ticket_list_create, name='ticket_list_create'),
    path('<int:pk>/', views.ticket_detail, name='ticket_detail'),
]
