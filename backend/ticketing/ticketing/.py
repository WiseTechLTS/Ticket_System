import json
import random
import os
from django.core.wsgi import get_wsgi_application

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  # Adjusted settings module
application = get_wsgi_application()

from ticketing.models import Ticket, User, Department
from datetime import datetime, timedelta

# Fetch existing departments and users
departments = list(Department.objects.all())
users = list(User.objects.all())

if not departments:
    print("❌ Error: No departments found in the database.")
    exit()

if not users:
    print("⚠️ Warning: No users found. Assigning all tickets to 'None'.")

# Sample Data
issues = ["System Crash", "Request for Data", "Login Issues", "Equipment Failure", "New Account Request"]
priorities = ["1", "2", "3"]  # Low, Medium, High

# Generate 1,000 Tickets
num_tickets = 1000
start_date = datetime(2025, 1, 1)  # Start date for ticket creation
tickets = []

for i in range(1, num_tickets + 1):
    department = random.choice(departments)
    user = random.choice(users) if users else None

    ticket = {
        "id": i,
        "name": f"User {i}",
        "email": f"user{i}@example.com",
        "phone": f"{random.randint(8000000000, 8999999999)}",
        "issue": random.choice(issues),
        "priority": random.choice(priorities),  # Priority is randomly assigned
        "created_at": (start_date + timedelta(days=random.randint(0, 50), seconds=random.randint(0, 86400))).isoformat(),
        "user": user.id if user else None,
        "department": department.id,
    }
    
    tickets.append(ticket)

# Save to JSON file
output_file_path = os.path.join(os.getcwd(), "ticketing/generated_tickets.json")
with open(output_file_path, "w") as json_file:
    json.dump(tickets, json_file, indent=4)

print(f"✅ Successfully generated {len(tickets)} tickets. File saved to: {output_file_path}")
