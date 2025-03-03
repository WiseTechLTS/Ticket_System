#!/usr/bin/env python
import os
import django
import random
from django.core.files import File

# Configure the Django environment with the appropriate settings module.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Update as needed.
django.setup()

from ticketing.models import Ticket, Department, PriorityLevel

# Sample data for randomization
FIRST_NAMES = ["Jane", "John", "Alice", "Bob", "Charlie", "Eve", "Grace", "Hank", "Ivy", "Mike"]
LAST_NAMES = ["Smith", "Doe", "Brown", "Johnson", "Williams", "Jones", "Davis", "Miller", "Wilson", "Moore"]

# Common IT issues within hospitals
ISSUE_TEMPLATES = [
    "The electronic health record system is experiencing intermittent outages.",
    "Patient monitoring devices are not syncing with the central server.",
    "Scheduled maintenance on the radiology imaging system has failed.",
    "Wi-Fi connectivity is unstable in the emergency department.",
    "Security alerts triggered due to unusual login patterns on the medical devices.",
    "Printer in the nurse's station is offline and not processing orders.",
    "The hospital intranet is slow, affecting access to patient records.",
    "Software update for the lab information system caused unexpected errors.",
    "Network segmentation issues are impacting data transmission in the ICU.",
    "Remote access to the hospital's IT portal is not functioning properly."
]

# Local image file options
IMAGE_FILES = ["placeholder-image.jpg", "pngtree.jpg"]

def generate_random_ticket_info(i):
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    name = f"{first_name} {last_name} {i}"
    email = f"{first_name.lower()}.{last_name.lower()}{i}@example.com"
    # Select an IT issue relevant to hospital operations.
    issue = f"{random.choice(ISSUE_TEMPLATES)} (Ticket #{i})"
    return name, email, issue

def main():
    # Validate that at least one PriorityLevel exists.
    priority_level = PriorityLevel.objects.first()
    if not priority_level:
        print("❌ No PriorityLevel entries found. Please create them first.")
        return

    # Validate that there is at least one Department in the database.
    departments = list(Department.objects.all())
    if not departments:
        print("❌ No Department entries found. Please create at least one department.")
        return

    # Ensure the local image files exist.
    missing_files = [img for img in IMAGE_FILES if not os.path.exists(img)]
    if missing_files:
        print(f"❌ Missing image files: {', '.join(missing_files)}. Please add them to the directory.")
        return

    num_tickets = 1000
    num_departments = len(departments)

    # Create 1000 tickets with each ticket assigned to a department in a round-robin fashion.
    for i in range(num_tickets):
        try:
            name, email, issue = generate_random_ticket_info(i)
            # Randomly choose an image file from the available options.
            selected_image = random.choice(IMAGE_FILES)
            # Construct a unique file name based on the selected image.
            local_filename = f"{os.path.splitext(selected_image)[0]}_{i}.jpg"

            # Round-robin selection of departments.
            selected_department = departments[i % num_departments]

            with open(selected_image, "rb") as f:
                file_obj = File(f, name=local_filename)
                # Create the ticket without an image first.
                ticket = Ticket.objects.create(
                    name=name,
                    email=email,
                    department=selected_department,
                    # Use the department's priority if available, otherwise use the fallback.
                    priority=selected_department.priority or priority_level,
                    issue=issue
                )
                # Save the file to the Ticket's image field.
                ticket.image.save(local_filename, file_obj, save=True)
                # Update the image_url to point to the newly saved file.
                ticket.image_url = f"http://10.10.10.1:8000/media/tickets/{local_filename}"
                ticket.save()

            print(f"✅ Ticket Created: {ticket.id} - {ticket.name} (Dept: {selected_department.name} | Image: {selected_image})")
        except Exception as e:
            print(f"❌ An error occurred while creating ticket #{i}: {e}")

if __name__ == "__main__":
    main()
