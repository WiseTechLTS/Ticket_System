from celery import shared_task
from .models import Ticket

@shared_task
def generate_tickets():
    # Logic to create 1300+ tickets asynchronously
    pass
