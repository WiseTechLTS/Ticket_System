from django.urls import path
from tickets import views

# <<<<<<<<<<<<<<<<< EXAMPLE FOR STARTER CODE USE <<<<<<<<<<<<<<<<<

urlpatterns = [
    path('all/', views.get_all_tickets),
    path('create/', views.create_ticket),
    path('update/<int:pk>/', views.update_ticket),
    path('<int:pk>/', views.delete_ticket),
]
