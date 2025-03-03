import json
import os
from django.core.management.base import BaseCommand
from ticketing.models import Ticket, User, Department, SubDepartment

class Command(BaseCommand):
    help = "Load ticket data from JSON into the database"

    def handle(self, *args, **kwargs):
        # Get absolute path to ensure Django finds the file
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(BASE_DIR, "..", "..", "generated_tickets.json")

        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"❌ Error: File not found at {file_path}"))
            return

        try:
            with open(file_path, "r") as file:
                tickets = json.load(file)

            created_count = 0
            for ticket in tickets:
                user = User.objects.filter(pk=ticket["user"]).first()
                department = Department.objects.filter(pk=ticket["department"]).first()
                sub_department = SubDepartment.objects.filter(pk=ticket["sub_department"]).first()

                if not department:
                    self.stderr.write(self.style.ERROR(f"❌ Skipping Ticket #{ticket['id']} - Department {ticket['department']} does not exist."))
                    continue

                if not sub_department:
                    self.stderr.write(self.style.ERROR(f"❌ Skipping Ticket #{ticket['id']} - SubDepartment {ticket['sub_department']} does not exist."))
                    continue

                Ticket.objects.create(
                    user=user,
                    name=ticket["name"],
                    email=ticket["email"],
                    phone=ticket["phone"],
                    issue=ticket["issue"],
                    priority=ticket["priority"],
                    created_at=ticket["created_at"],
                    department=department,
                    sub_department=sub_department,
                )
                created_count += 1

            self.stdout.write(self.style.SUCCESS(f"✅ Successfully loaded {created_count} tickets into the database!"))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Error: {e}"))
