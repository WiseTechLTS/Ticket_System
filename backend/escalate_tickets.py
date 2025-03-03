#!/usr/bin/env python
import os
import django

# Configure the Django environment with the appropriate settings module.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")  # Update as needed.
django.setup()

from ticketing.models import Ticket

<<<<<<< HEAD
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
=======
# Mapping of common hospital IT issues to recommended fixes.
FIXES = {
    "The electronic health record system is experiencing intermittent outages.": 
        "Restart the EHR server, clear caches, and check network load.",
    "Patient monitoring devices are not syncing with the central server.": 
        "Verify device configurations and network connectivity; update firmware if needed.",
    "Scheduled maintenance on the radiology imaging system has failed.": 
        "Review system logs, reschedule maintenance, and test system responsiveness.",
    "Wi-Fi connectivity is unstable in the emergency department.": 
        "Optimize router placement, update firmware, and check for interference.",
    "Security alerts triggered due to unusual login patterns on the medical devices.": 
        "Investigate login logs, enforce strong authentication, and update security protocols.",
    "Printer in the nurse's station is offline and not processing orders.": 
        "Restart the printer, verify network settings, and check for driver updates.",
    "The hospital intranet is slow, affecting access to patient records.": 
        "Analyze network bandwidth usage and consider hardware upgrades or traffic shaping.",
    "Software update for the lab information system caused unexpected errors.": 
        "Rollback the update, apply patches after thorough testing, and document changes.",
    "Network segmentation issues are impacting data transmission in the ICU.": 
        "Reconfigure network segments, test connectivity, and consult network logs.",
    "Remote access to the hospital's IT portal is not functioning properly.": 
        "Restart VPN services, review remote access policies, and verify firewall rules."
}

def determine_fix(issue_text):
    """
    Determines the recommended fix based on the issue description.
    Uses substring matching to accommodate additional context in the ticket's issue field.
    """
    for template, fix in FIXES.items():
        if template in issue_text:
            return fix
    return "No recommended fix available."

def main():
    tickets = Ticket.objects.all()
    if not tickets:
        print("No tickets found in the database.")
        return

    # Dictionary to track the number of occurrences of each fix,
    # ensuring that each admin_fix string is unique.
    fix_occurrences = {}

    print("Starting unique admin fix assignment process for all tickets...\n")
    for ticket in tickets:
        recommended_fix = determine_fix(ticket.issue)

        # Increment occurrence count for this recommended fix.
        occurrence = fix_occurrences.get(recommended_fix, 0) + 1
        fix_occurrences[recommended_fix] = occurrence

        # If this fix has been assigned before, append an occurrence suffix to guarantee uniqueness.
        unique_fix = recommended_fix if occurrence == 1 else f"{recommended_fix} ({occurrence})"

        # Update the ticket with the unique admin fix.
        ticket.admin_fix = unique_fix
        ticket.save()

        print(f"Ticket ID: {ticket.id}")
        print(f"Department: {ticket.department.name}")
        print(f"Issue: {ticket.issue}")
        print(f"Unique Admin Fix: {unique_fix}")
        print("-" * 50)
>>>>>>> 58cd98e6dc8fbccbc6ee57efd57ae27aa519d263

if __name__ == "__main__":
    main()
