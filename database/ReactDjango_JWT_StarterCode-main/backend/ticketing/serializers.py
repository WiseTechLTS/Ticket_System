from rest_framework import serializers
from .models import Ticket

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = '__all__'
        # or fields = ['id', 'name', 'email', 'phone', 'department', 'sub_department', 'issue', 'screenshot', 'created_at']
