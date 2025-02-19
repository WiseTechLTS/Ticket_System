from django.urls import path, include
from ticketing import views
from django.conf import settings
from django.conf.urls.static import static
 
# <<<<<<<<<<<<<<<<< EXAMPLE FOR STARTER CODE USE <<<<<<<<<<<<<<<<<

urlpatterns = [
    path('', views.user_tickets),
    path('all/', views.get_all_tickets),
    path('<int:ticket_id>/', views.create_ticket),
    path('delete/<int:ticket_id>/', views.delete_ticket),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# Compare this snippet from backend/ticketing/admin.py:
