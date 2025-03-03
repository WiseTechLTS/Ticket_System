import os
import sys
import random
import django
from django.db import transaction

# -----------------------------------------------------------------------------
# Initialize Django settings before importing models.
# -----------------------------------------------------------------------------
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")
django.setup()

from authentication.models import User  # Only if user creation checks are needed
from ticketing.models import PriorityLevel, Department, Ticket

def seed_data(num_ticketing=1000):
    """
    Efficiently seeds the database with:
      - PriorityLevel
      - Department (with respective categories)
      - Ticket (up to num_ticketing specified)

    Leverages Django bulk operations for improved performance and maintainability.

    :param num_ticketing: (int) Number of randomized Ticket records to create (default=1000).
    """

    # -------------------------------------------------------------------------
    # 1. Establish PriorityLevel Levels
    #    Ensures consistent references in Department and Ticket creation.
    # -------------------------------------------------------------------------
    priorityLevel_levels = {
        1: "Level 1 (Lowest)",
        2: "Level 2 (Medium)",
        3: "Level 3 (Highest)",
    }
    
    with transaction.atomic():
        # Create or get priorityLevel records
        priorityLevel_objects = {}
        for level_int, _label in priorityLevel_levels.items():
            prio, created = PriorityLevel.objects.get_or_create(level=level_int)
            priorityLevel_objects[level_int] = prio
            if created:
                print(f"[INFO] Created PriorityLevelLevel: {prio}")
            else:
                print(f"[INFO] PriorityLevelLevel already exists: {prio}")

    # -------------------------------------------------------------------------
    # 2. Define Department Data
    #    Each item in 'department_data' maps a category to:
    #      { priorityLevel_level: [department_names] }
    #
    #    This results in multiple Department objects sharing a category but
    #    differentiating on priorityLevel level.
    # -------------------------------------------------------------------------
    department_data = {
        "Medical": {
            1: [
                "PEDIATRICS",
                "OB-GYN",
                "CARDIOLOGY",
                "ONCOLOGY",
                "ORTHOPEDICS",
                "NEUROLOGY",
                "PSYCHIATRY AND MENTAL HEALTH",
                "DERMATOLOGY",
                "RADIOLOGY AND IMAGING",
                "PATHOLOGY",
            ],
            3: [
                "OUTPATIENT DEPARTMENT (OPD)",
                "EMERGENCY DEPARTMENT (ED)",
                "INPATIENT DEPARTMENT",
                "SURGERY (OR)",
                "INTENSIVE CARE UNIT (ICU)",
            ],
        },
        "Administrative": {
            1: [
                "BILLING AND FINANCE",
                "HUMAN RESOURCES (HR)",
                "MEDICAL RECORDS",
                "QUALITY ASSURANCE",
                "PUBLIC RELATIONS / MARKETING",
            ],
            3: [
                "ADMISSIONS AND REGISTRATION",
            ],
        },
        "Support/Ancillary": {
            1: [
                "PHARMACY",
                "LABORATORY SERVICES",
                "BIOMEDICAL ENGINEERING",
            ],
            2: [
                "HOUSEKEEPING / ENVIRONMENTAL SERVICES",
                "CATERING AND NUTRITION",
            ],
            3: [
                "SECURITY",
                "IT / TECHNOLOGY",
                "TRANSPORT SERVICES",
            ],
        },
    }

    # -------------------------------------------------------------------------
    # 3. Prepare Randomized Ticket Data
    # -------------------------------------------------------------------------
    issues = [
        "Encountered intermittent scheduling errors leading to minor delays in service delivery.",
        "Experienced occasional electronic record glitches, causing slight data access delays.",
        "Reported temporary communication failures between monitoring devices and central systems.",
        "Faced moderate scheduling challenges with housekeeping tasks not updating in real-time.",
        "Reported delays in receiving maintenance requests due to system lags in the queue.",
        "Noted intermittent synchronization issues between task management and staff schedules.",
        "Prolonged delays in electronic check-in processes caused significant patient backlog.",
        "System encountered a catastrophic outage of its alert system, compromising response times.",
        "Suffered a critical failure in the intake process, creating extended wait times.",
        "Encountered a complete outage of its alarm systems during peak hours.",
        "Discovered moderate delays in updating pre-operative and post-operative protocols.",
        "Reported connectivity issues with lab analyzers, causing random data lapses.",
        "Sporadic misalignment in appointment bookings and follow-up reminders, confusing patients.",
        "Observed minor issues with data transmission between imaging tools and the central server.",
        "Experienced network latency in processing diagnostic tests, creating scheduling conflicts.",
        "System constraints led to slow retrieval of patient records during peak usage.",
        "Temporary miscalculations in financial batch processing, leading to invoice discrepancies.",
        "Routine system audit uncovered minor timekeeping mismatches with attendance records.",
        "Delays in digital content updates impacted internal communication and marketing rollout.",
        "Encountered sporadic errors in device calibration logs, prompting additional maintenance.",
    ]
    first_names = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
        "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
        "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
        "Matthew", "Betty", "Anthony", "Margaret", "Donald", "Sandra", "Mark", "Ashley",
        "Paul", "Kimberly", "Steven", "Emily", "Andrew", "Donna", "Kenneth", "Michelle",
        "Joshua", "Carol", "George", "Amanda", "Kevin", "Dorothy", "Brian", "Melissa",
        "Edward", "Deborah"
    ]
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia",
        "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez",
        "Moore", "Martin", "Jackson", "Thompson", "White", "Lopez", "Lee", "Gonzalez",
        "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez", "Hall", "Young",
        "Allen", "Sanchez", "Wright", "King", "Scott", "Green", "Baker", "Adams",
        "Nelson", "Hill", "Ramirez", "Campbell", "Mitchell", "Roberts", "Carter",
        "Phillips", "Evans", "Turner", "Torres"
    ]
    # Optionally set a random remote image URL (or leave blank for now)
    image_urls = [
        "https://example.com/ticketing/sample1.png",
        "https://example.com/ticketing/sample2.png",
        "https://example.com/ticketing/sample3.png",
    ]

    # -------------------------------------------------------------------------
    # 4. Transactional Seeding for Department & ticketing
    # -------------------------------------------------------------------------
    with transaction.atomic():
        # ---------------------------------------------------------------------
        # 4.1 Seed Department Objects
        # ---------------------------------------------------------------------
        department_objects = []
        for category, priorities_map in department_data.items():
            for lvl, dept_names in priorities_map.items():
                for dname in dept_names:
                    dept_obj, created = Department.objects.get_or_create(
                        name=dname,
                        category=category,
                        priority=PriorityLevel.objects.get(level=lvl),
                    )
                    if created:
                        print(f"[INFO] Created Department: {dept_obj}")
                    else:
                        print(f"[INFO] Department already exists: {dept_obj}")
                    department_objects.append(dept_obj)
        
        # ---------------------------------------------------------------------
        # 4.2 Generate 'num_ticketing' Randomized ticketing
        # ---------------------------------------------------------------------
        ticketing_to_create = []

        # Retrieve the full department list again to ensure we capture everything
        all_department = list(Department.objects.all())

        for i in range(num_ticketing):
            # Random name data
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            name = f"{first_name} {last_name}"
            email = f"{first_name.lower()}.{last_name.lower()}@wcjc.it"

            # Random department and associated priorityLevel
            department_choice = random.choice(all_department)
            priorityLevel_choice = department_choice.priority  # Align ticket priorityLevel with department

            # Select a random issue description
            issue_text = random.choice(issues)

            # Random image URL or blank
            image_url = random.choice(image_urls) if random.randint(0, 1) else ""

            # Half the ticketing might have a random admin fix; the rest remain None
            admin_fix_choices = [fix[0] for fix in Ticket.ADMIN_FIX_CHOICES]
            admin_fix_choice = random.choice(admin_fix_choices) if random.randint(0, 1) else None

            ticketing_to_create.append(
                Ticket(
                    name=name,
                    email=email,
                    department=department_choice,
                    priority=priorityLevel_choice,
                    issue=issue_text,
                    image_url=image_url,
                    admin_fix=admin_fix_choice,
                )
            )

        Ticket.objects.bulk_create(ticketing_to_create)
        print(f"[INFO] Successfully generated {num_ticketing} Ticket record(s).")


if __name__ == "__main__":
    """
    Usage:
        python seed_data.py
            -> Creates 1000 ticketing by default

        python seed_data.py 500
            -> Creates 500 ticketing instead
    """
    num_ticketing_to_create = 1000
    if len(sys.argv) > 1:
        try:
            num_ticketing_to_create = int(sys.argv[1])
        except ValueError:
            print(f"[WARN] '{sys.argv[1]}' is not a valid integer. Defaulting to 1000.")

    seed_data(num_ticketing=num_ticketing_to_create)
