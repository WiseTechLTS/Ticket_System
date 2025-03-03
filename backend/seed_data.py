import os
import sys
import random
import django
from django.db import transaction

# -------------------------------------------------------------------------
# Initialize Django settings before importing models
# -------------------------------------------------------------------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")
django.setup()

from authentication.models import User
from tickets.models import (
    PriorityLevel,
    MainDepartment,
    SubDepartment,
    Ticket,
)

def seed_data(num_tickets=1000):
    """
    Seeds the database with default PriorityLevel, MainDepartment, SubDepartment,
    and random Ticket records. Ensures data integrity and a robust starting
    point for development/testing.

    :param num_tickets: Number of random Ticket records to create.
    """

    # ---------------------------------------------------------------------
    # 1. Seed PriorityLevel
    # ---------------------------------------------------------------------
    priority_mapping = {
        3: "Level 3 (Highest)",
        2: "Level 2 (Medium)",
        1: "Level 1 (Lowest)",
    }

    with transaction.atomic():
        # Create or retrieve the three standard priority levels.
        priority_objects = {}
        for level_int, level_description in priority_mapping.items():
            prio, created = PriorityLevel.objects.get_or_create(
                level=level_int,
                defaults={"description": level_description},
            )
            priority_objects[level_int] = prio
            if created:
                print(f"[INFO] Created PriorityLevel: {prio}")
            else:
                # Update the description if needed
                if prio.description != level_description:
                    prio.description = level_description
                    prio.save()
                print(f"[INFO] PriorityLevel already exists: {prio}")

    # ---------------------------------------------------------------------
    # 2. Seed MainDepartment and SubDepartment
    #    In your models, MainDepartment has a name, and SubDepartment
    #    references both MainDepartment and PriorityLevel.
    # ---------------------------------------------------------------------
    # Define your top-level departments
    main_dept_names = [
        "Medical",
        "Administrative",
        "Support/Ancillary",
    ]

    with transaction.atomic():
        # Create or retrieve the main departments
        main_department_objects = {}
        for dept_name in main_dept_names:
            main_dept, created = MainDepartment.objects.get_or_create(name=dept_name)
            if created:
                print(f"[INFO] Created MainDepartment: {main_dept}")
            else:
                print(f"[INFO] MainDepartment already exists: {main_dept}")
            main_department_objects[dept_name] = main_dept

    # Example sub-departments per main department and priority.
    # You can adjust these lists to reflect your real-world structure.
    subdepartment_data = {
        "Medical": {
            3: [
                "Emergency Department (ED)",
                "Intensive Care Unit (ICU)",
                "Surgery (OR)",
            ],
            2: [
                "Neurology",
                "Psychiatry and Mental Health",
            ],
            1: [
                "Pediatrics",
                "Dermatology",
                "Pathology",
            ],
        },
        "Administrative": {
            3: [
                "Admissions and Registration",
            ],
            2: [
                "Quality Assurance",
                "Public Relations / Marketing",
            ],
            1: [
                "Billing and Finance",
                "Human Resources (HR)",
                "Medical Records",
            ],
        },
        "Support/Ancillary": {
            3: [
                "IT / Technology",
                "Security",
            ],
            2: [
                "Housekeeping / Environmental Services",
                "Transport Services",
            ],
            1: [
                "Pharmacy",
                "Laboratory Services",
            ],
        },
    }

    with transaction.atomic():
        # Create or retrieve sub-departments with assigned PriorityLevel
        subdepartment_objects = []
        for main_dept_name, priorities_map in subdepartment_data.items():
            main_dept = main_department_objects[main_dept_name]
            for level_int, subdept_names in priorities_map.items():
                for sname in subdept_names:
                    # Because priority is a ForeignKey in SubDepartment
                    priority_obj = priority_objects[level_int]
                    subdept, created = SubDepartment.objects.get_or_create(
                        name=sname,
                        main_department=main_dept,
                        defaults={"priority": priority_obj},
                    )
                    if not created:
                        # Ensure priority is accurate if it changed
                        if subdept.priority != priority_obj:
                            subdept.priority = priority_obj
                            subdept.save()
                    if created:
                        print(f"[INFO] Created SubDepartment: {subdept}")
                    else:
                        print(f"[INFO] SubDepartment already exists: {subdept}")
                    subdepartment_objects.append(subdept)

    # ---------------------------------------------------------------------
    # 3. Prepare random data for Ticket creation
    # ---------------------------------------------------------------------
    # For demonstration: 20 random issues, random first/last names, etc.
    issues = [
        "Brief network disruption affecting critical systems.",
        "Delayed scheduling tasks leading to minor backlog.",
        "Intermittent errors in communication logs.",
        "Slow retrieval times for medical records.",
        "System mismatch in staff rosters and shift changes.",
        "Error prompting for additional security checks.",
        "Laboratory data not syncing promptly to central server.",
        "Random UI glitch impacting front-desk efficiency.",
        "Connectivity drop in outpatient monitoring tools.",
        "Temporary meltdown in inventory ordering processes.",
        "Prolonged backups in billing and finance queries.",
        "Glitches in HR record updates causing incomplete data.",
        "Latency in patient admission procedures.",
        "Queue freeze observed in the pharmacy dispatch system.",
        "Maintenance tasks failing to generate automated tickets.",
        "Minor disruptions in imaging tool data flow.",
        "Repetitive logouts observed under heavy usage.",
        "Delayed cafeteria supply updates in distribution workflow.",
        "Insufficient encryption on certain internal messages.",
        "Systemic error in patient-lab test result merges.",
    ]

    first_names = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer",
        "Michael", "Linda", "William", "Elizabeth", "David", "Barbara",
    ]
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller",
        "Davis", "Garcia", "Wilson", "Anderson", "Taylor", "Thomas",
    ]
    # Titles for tickets—could be more descriptive or domain-specific
    ticket_titles = [
        "System Outage",
        "Performance Degradation",
        "Software Bug",
        "Data Sync Error",
        "Request for Maintenance",
        "Minor Glitch",
        "Configuration Update",
        "Urgent Disruption",
        "Connectivity Problem",
        "Access Rights Issue",
    ]

    # Retrieve or create a default user to associate with newly created tickets
    # Adjust logic if you want to randomly pick from multiple users
    default_user, _ = User.objects.get_or_create(
        username="defaultuser",
        defaults={"email": "defaultuser@example.com"}
    )

    # ---------------------------------------------------------------------
    # 4. Bulk-create Ticket records
    # ---------------------------------------------------------------------
    # Collect all subdepartments in a list for random assignment
    all_subdepartments = list(SubDepartment.objects.all())
    tickets_to_create = []

    with transaction.atomic():
        for _ in range(num_tickets):
            subdept = random.choice(all_subdepartments)
            # SubDepartment implicitly has a priority
            priority_obj = subdept.priority

            f_name = random.choice(first_names)
            l_name = random.choice(last_names)
            email = f"{f_name.lower()}.{l_name.lower()}@demo.com"

            # Compose a random ticket
            tickets_to_create.append(
                Ticket(
                    user=default_user,
                    first_name=f_name,
                    last_name=l_name,
                    email=email,
                    title=random.choice(ticket_titles),
                    issue=random.choice(issues),
                    sub_department=subdept,
                    PriorityLevel=priority_obj,
                    # Arbitrarily mark all tickets as "open" or random
                    status="open",
                )
            )

        Ticket.objects.bulk_create(tickets_to_create)
        print(f"[INFO] Successfully generated {num_tickets} Ticket(s).")

if __name__ == "__main__":
    """
    Usage:
        python seed_data.py
            -> Creates 1000 Tickets by default.

        python seed_data.py 500
            -> Creates 500 Tickets instead.
    """
    num_tickets_to_create = 1000
    if len(sys.argv) > 1:
        try:
            num_tickets_to_create = int(sys.argv[1])
        except ValueError:
            print(f"[WARN] '{sys.argv[1]}' is not a valid integer. Defaulting to 1000.")

    seed_data(num_tickets=num_tickets_to_create)
