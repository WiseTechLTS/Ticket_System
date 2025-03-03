import os
import json
from django.core.management.base import BaseCommand
from ticketing.models import Ticket

class Command(BaseCommand):
    help = "Load ticket data from generated_tickets.json into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='ticketing/fixtures/generated_tickets.json',
            help='Path to the JSON fixture file.'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        try:
            with open(file_path, "r") as json_file:
                tickets_data = json.load(json_file)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error reading JSON file: {e}"))
            return

        ticket_objects = []
        for entry in tickets_data:
            fields = entry.get("fields", {})
            # Create a Ticket instance using the fixture fields.
            ticket_objects.append(
                Ticket(
                    pk=entry.get("pk"),
                    name=fields.get("name"),
                    email=fields.get("email"),
                    phone=fields.get("phone"),
                    issue=fields.get("issue"),
                    priority=fields.get("priority"),
                    created_at=fields.get("created_at"),
                    image=fields.get("image"),  # Ensure your model field is named 'image'
                    user=fields.get("user"),    # This may require conversion if not null
                    department_id=fields.get("department")
                )
            )

        # Use bulk_create for efficiency. Set ignore_conflicts=True if you want to skip duplicate primary keys.
        try:
            Ticket.objects.bulk_create(ticket_objects, ignore_conflicts=True)
            self.stdout.write(self.style.SUCCESS(f"Successfully loaded {len(ticket_objects)} tickets."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error saving tickets: {e}"))
