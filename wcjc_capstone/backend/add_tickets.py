import os
import django

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Replace with your Django project name
django.setup()

from ticketing.models import Ticket, Department, SubDepartment
from django.contrib.auth import get_user_model

User = get_user_model()

# 🔹 Fetch a test user (Change this if needed)
user = User.objects.first()  # Ensure a user exists

if not user:
    print("❌ No users found in the database. Create a user first.")
    exit()

# 🔹 Fetch a Department & SubDepartment
department = Department.objects.first()
sub_department = SubDepartment.objects.first()

if not department or not sub_department:
    print("❌ No Departments or SubDepartments found. Create them first.")
    exit()

# 🔹 Create a Ticket
ticket = Ticket.objects.create(
    user=user,
    name="John Doe",
    email="john.doe@example.com",
    phone="123-456-7890",
    department=department,
    sub_department=sub_department,
    issue="System is crashing when I try to save a file.",
    priority=sub_department.priority  # Auto-assign priority based on SubDepartment
)

print(f"✅ Ticket Created: {ticket.id} - {ticket.name} (Priority: {ticket.priority})")
