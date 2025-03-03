import os
import django

# Set up Django environment (update "drf_jwt_backend.settings" to your settings module)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")
django.setup()

from tickets.models import PriorityLevel, MainDepartment, SubDepartment

# ----------------------------------------------------------------------------
# Step 1: Create Priority Levels
# ----------------------------------------------------------------------------
priority_data = {
    3: "Level 3 (Highest)",
    2: "Level 2 (Medium)",
    1: "Level 1 (Lowest)",
}

for level, description in priority_data.items():
    priority, created = PriorityLevel.objects.get_or_create(
        level=level,
        defaults={"description": description}
    )
    if created:
        print(f"Created PriorityLevel: {priority}")
    else:
        print(f"PriorityLevel already exists: {priority}")

# ----------------------------------------------------------------------------
# Step 2: Create Main Departments
# ----------------------------------------------------------------------------
main_departments = ["Medical", "Administrative", "Support/Ancillary"]

for dept_name in main_departments:
    main_dept, created = MainDepartment.objects.get_or_create(name=dept_name)
    if created:
        print(f"Created MainDepartment: {main_dept}")
    else:
        print(f"MainDepartment already exists: {main_dept}")

# ----------------------------------------------------------------------------
# Step 3: Create SubDepartments for Each Main Department
# ----------------------------------------------------------------------------
departments_data = {
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

for main_dept_name, priorities in departments_data.items():
    main_dept = MainDepartment.objects.get(name=main_dept_name)
    for priority_level, subdept_list in priorities.items():
        try:
            priority = PriorityLevel.objects.get(level=priority_level)
        except PriorityLevel.DoesNotExist:
            print(f"Priority level {priority_level} not found. Skipping subdepartments for this level.")
            continue

        for subdept_name in subdept_list:
            subdept, created = SubDepartment.objects.get_or_create(
                name=subdept_name,
                defaults={
                    # Explicitly store the IDs for clarity and performance
                    "main_department_id": main_dept.id,
                    "priority_id": priority.id,
                }
            )
            if created:
                print(f"Created SubDepartment: {subdept}")
            else:
                print(f"SubDepartment already exists: {subdept}")

print("Data loading complete.")
