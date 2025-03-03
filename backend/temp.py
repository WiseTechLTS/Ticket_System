<<<<<<< HEAD
#!/usr/bin/env python
import os
import django
import random
import time
import argparse
from django.core.files import File
from faker import Faker

# Configure the Django environment with the appropriate settings module.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Update as needed.
django.setup()

from ticketing.models import Ticket, Department, PriorityLevel

# Initialize Faker for generating unique random data.
fake = Faker()

def get_random_department(departments):
    """Return a random Department from the provided list."""
    return random.choice(departments)

def get_random_priority(department, fallback_priority):
    """Return the department's priority if available, otherwise a fallback."""
    return getattr(department, 'priority', None) or fallback_priority

def generate_random_issue(ticket_number):
    """
    Dynamically construct a unique and complex IT issue description.
    Combines randomized technical terms and context for diversity.
    """
    technical_terms = [
        "network latency", "database deadlock", "API timeout", "server overload",
        "encryption mismatch", "load balancer failure", "caching anomaly", "firewall misconfiguration"
    ]
    extra_details = fake.sentence(nb_words=15)
    term = random.choice(technical_terms)
    return f"{extra_details} Detected {term} during operation. (Ticket #{ticket_number})"

def generate_random_subject():
    """Generate a random subject title for the ticket."""
    subjects = [
        "System Outage", "Login Failure", "Data Sync Issue", "Performance Degradation",
        "Unexpected Error", "Security Breach", "Network Latency", "Configuration Error"
    ]
    return random.choice(subjects)

def generate_random_ticket_info(ticket_number):
    """
    Generate random ticket data.
    Returns a tuple with name, email, phone, subject, issue, and a detailed description.
    """
    name = fake.name()
    email = fake.email()
    phone = fake.phone_number()
    subject = generate_random_subject()
    issue = generate_random_issue(ticket_number)
    description = fake.paragraph(nb_sentences=5)
    return name, email, phone, subject, issue, description

def create_ticket(name, email, phone, subject, issue, description, selected_department, selected_image, local_filename, fallback_priority):
    """
    Create a Ticket instance with the provided information.
    If the Ticket model includes extra fields (phone, subject, description), they are set accordingly.
    """
    try:
        with open(selected_image, "rb") as f:
            file_obj = File(f, name=local_filename)
            # Create the ticket.
            ticket = Ticket.objects.create(
                name=name,
                email=email,
                department=selected_department,
                priority=get_random_priority(selected_department, fallback_priority),
                issue=issue
            )
            # Save the image.
            ticket.image.save(local_filename, file_obj, save=True)
            ticket.image_url = f"http://10.10.10.1:8000/media/tickets/{local_filename}"
            
            # Update additional fields if available.
            if hasattr(ticket, 'phone'):
                ticket.phone = phone
            if hasattr(ticket, 'subject'):
                ticket.subject = subject
            if hasattr(ticket, 'description'):
                ticket.description = description
            
            ticket.save()
        print(f"✅ Ticket Created: {ticket.id} - {ticket.name} | Dept: {selected_department.name} | Image: {selected_image}")
    except Exception as e:
        print(f"❌ Error creating ticket: {e}")

def update_ticket_status(ticket, new_status):
    """
    Simulate an update to a ticket's status.
    This function could be expanded to include more complex logic.
    """
    ticket.status = new_status
    ticket.save()
    print(f"Ticket {ticket.id} status updated to {new_status}.")

def simulate_ticket_workflow(ticket, departments):
    """
    Simulate additional functionality by randomly updating ticket status,
    assigning fixes, or triggering alerts.
    """
    statuses = ["New", "In Progress", "Resolved", "Closed"]
    new_status = random.choice(statuses)
    update_ticket_status(ticket, new_status)
    
    # Randomly simulate assigning the ticket to another department.
    if random.random() < 0.3:
        new_department = get_random_department(departments)
        ticket.department = new_department
        ticket.save()
        print(f"Ticket {ticket.id} reassigned to department {new_department.name}.")

def main():
    parser = argparse.ArgumentParser(
        description="Automatically generate unique tickets with randomized data."
    )
    parser.add_argument("--num_tickets", type=int, default=100,
                        help="Number of tickets to generate (default: 100)")
    parser.add_argument("--images", type=str, default="placeholder-image.jpg,pngtree.jpg",
                        help="Comma-separated list of image file paths (default: 'placeholder-image.jpg,pngtree.jpg')")
    parser.add_argument("--delay", type=float, default=0.2,
                        help="Delay (in seconds) between ticket creations (default: 0.2)")
    args = parser.parse_args()

    num_tickets = args.num_tickets
    image_files = [f.strip() for f in args.images.split(",") if f.strip()]
    missing_files = [img for img in image_files if not os.path.exists(img)]
    if missing_files:
        print(f"Missing image files: {', '.join(missing_files)}. Please add them and try again.")
        return

    # Validate that at least one PriorityLevel exists.
    fallback_priority = PriorityLevel.objects.first()
    if not fallback_priority:
        print("❌ No PriorityLevel entries found. Please create them first.")
        return

    # Validate that there is at least one Department.
    departments = list(Department.objects.all())
    if not departments:
        print("❌ No Department entries found. Please create at least one department.")
        return

    # Open a log file to track ticket creation details.
    with open("ticket_creation.log", "a") as log_file:
        for i in range(1, num_tickets + 1):
            # Generate randomized ticket details.
            name, email, phone, subject, issue, description = generate_random_ticket_info(i)
            selected_department = get_random_department(departments)
            selected_image = random.choice(image_files)
            local_filename = f"{os.path.splitext(os.path.basename(selected_image))[0]}_{i}.jpg"
            
            # Create the ticket.
            create_ticket(name, email, phone, subject, issue, description,
                          selected_department, selected_image, local_filename,
                          fallback_priority)
            
            # Simulate additional workflow updates.
            try:
                ticket = Ticket.objects.get(image_url=f"http://10.10.10.1:8000/media/tickets/{local_filename}")
                simulate_ticket_workflow(ticket, departments)
            except Exception as e:
                print(f"Error simulating workflow for ticket: {e}")
            
            # Log the creation.
            log_file.write(f"Ticket #{i}: {name} | Dept: {selected_department.name} | Image: {selected_image}\n")
            # Optional delay to simulate processing time.
            time.sleep(args.delay)
    print("Ticket creation process completed.")

if __name__ == "__main__":
    main()
=======
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
>>>>>>> 58cd98e6dc8fbccbc6ee57efd57ae27aa519d263
