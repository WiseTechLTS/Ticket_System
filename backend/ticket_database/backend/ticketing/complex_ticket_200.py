#!/usr/bin/env python
import os
import django

# Configure the Django environment with the appropriate settings module.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Update as needed.
django.setup()

from ticketing.models import Ticket

def main():
    # Try to order by a creation timestamp if available; otherwise, order by descending id.
    try:
        latest_tickets = Ticket.objects.order_by("-created_at")[:200]
    except Exception:
        latest_tickets = Ticket.objects.order_by("-id")[:200]

    if not latest_tickets:
        print("No tickets found in the database.")
        return

    # Build a numbered list of issues from the latest tickets.
    print("List of Latest Complex IT Issues:")
    print("=" * 50)
    for idx, ticket in enumerate(latest_tickets, 1):
        # Assuming the 'issue' field contains a detailed description of the IT issue.
        print(f"{idx}. {ticket.issue}\n{'-' * 50}")

if __name__ == "__main__":
    main()
