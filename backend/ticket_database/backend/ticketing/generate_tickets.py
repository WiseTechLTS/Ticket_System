#!/usr/bin/env python
import os
import django

# Configure the Django environment with the proper settings module.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Update as needed.
django.setup()

from ticketing.models import Ticket, Department, PriorityLevel

def main():
    # 🔹 Ensure there is at least one PriorityLevel.
    priority_level = PriorityLevel.objects.first()
    if not priority_level:
        print("❌ No PriorityLevel entries found. Please create them first.")
        return

    # 🔹 Fetch a Department from the database.
    department = Department.objects.first()
    if not department:
        print("❌ No Department entries found. Please create a department first.")
        return

    # 🔹 Create a Ticket.
    try:
        ticket = Ticket.objects.create(
            name="Jane Smith",
            email="jane.smith@example.com",
            department=department,
            # Align the ticket's priority with the department's priority for consistency.
            priority=department.priority or priority_level,
            issue="Encountered a configuration error during processing.",
        )
        print(f"✅ Ticket Created: {ticket.id} - {ticket.name} - {ticket.department.name} (Priority: {ticket.priority})")
    except Exception as e:
        print(f"❌ An error occurred while creating the ticket: {e}")

if __name__ == "__main__":
    main()
