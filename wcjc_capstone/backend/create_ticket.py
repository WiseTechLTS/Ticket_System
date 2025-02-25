#!/usr/bin/env python
import os
import django

# Set up Django environment with the appropriate settings module.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Update as needed.
django.setup()

from ticketing.models import Ticket, Department, SubDepartment
from django.contrib.auth import get_user_model

User = get_user_model()

def main():
    # 🔹 Fetch a test user from the database.
    user = User.objects.first()
    if not user:
        print("❌ No users found in the database. Please create a user first.")
        return

    # 🔹 Fetch a Department & SubDepartment.
    department = Department.objects.first()
    sub_department = SubDepartment.objects.first()
    if not department or not sub_department:
        print("❌ No Departments or SubDepartments found. Please create them first.")
        return

    # 🔹 Create a Ticket with auto-assigned priority.
    try:
        ticket = Ticket.objects.create(
            user=user,
            name="John Doe",
            email="john.doe@example.com",
            phone="123-456-7890",
            department=department,
            sub_department=sub_department,
            issue="System is crashing when I try to save a file.",
            priority=sub_department.priority  # Auto-assign priority from the sub-department.
        )
        print(f"✅ Ticket Created: {ticket.id} - {ticket.name} (Priority: {ticket.priority})")
    except Exception as e:
        print(f"❌ An error occurred while creating the ticket: {e}")

if __name__ == "__main__":
    main()
