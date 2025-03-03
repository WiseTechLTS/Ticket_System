from rest_framework import serializers
from .models import PriorityLevel, MainDepartment, SubDepartment, Ticket


class MainDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainDepartment
        fields = ['__all__']

class PriorityLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriorityLevel
        fields = ["level", "description"]

class SubDepartmentSerializer(serializers.ModelSerializer):
    priority = PriorityLevelSerializer()

    class Meta:
        model = SubDepartment
        fields = ["id", "name", "priority"]

class TicketSerializer(serializers.ModelSerializer):
    sub_department_name = serializers.CharField(source="sub_department.name", read_only=True)
    main_department_name = serializers.CharField(source="sub_department.main_department.name", read_only=True)
    priority_level_description = serializers.CharField(source="PriorityLevel.description", read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "issue",
            "sub_department",
            "sub_department_name",
            "main_department_name",
            "PriorityLevel",
            "priority_level_description",
            "status",
            "created_at",
        ]
