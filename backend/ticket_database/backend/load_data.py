import django
import os

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_jwt_backend.settings")
django.setup()

from ticketing.models import PriorityLevel, Department

def load_priority_levels():
    levels = [
        (1, 'Level 1 (Lowest)'),
        (2, 'Level 2 (Medium)'),
        (3, 'Level 3 (Highest)')
    ]
    for level, desc in levels:
        PriorityLevel.objects.get_or_create(level=level)
    print("Priority levels loaded.")

def load_departments():
    department_data = [
        ('Emergency Department (ED)', 'Medical', 3),
        ('Outpatient Department (OPD)', 'Medical', 3),
        ('Inpatient Department', 'Medical', 3),
        ('Surgery (OR)', 'Medical', 3),
        ('Intensive Care Unit (ICU)', 'Medical', 3),
        ('Pediatrics', 'Medical', 2),
        ('OB-GYN', 'Medical', 2),
        ('Cardiology', 'Medical', 2),
        ('Oncology', 'Medical', 2),
        ('Orthopedics', 'Medical', 2),
        ('Neurology', 'Medical', 2),
        ('Psychiatry and Mental Health', 'Medical', 2),
        ('Dermatology', 'Medical', 2),
        ('Radiology and Imaging', 'Medical', 2),
        ('Pathology', 'Medical', 2),
        ('Admissions and Registration', 'Administrative', 3),
        ('Billing and Finance', 'Administrative', 1),
        ('Human Resources (HR)', 'Administrative', 1),
        ('Medical Records', 'Administrative', 1),
        ('Quality Assurance', 'Administrative', 1),
        ('Public Relations/Marketing', 'Administrative', 1),
        ('Pharmacy', 'Support/Ancillary', 2),
        ('Laboratory Services', 'Support/Ancillary', 2),
        ('Biomedical Engineering', 'Support/Ancillary', 2),
        ('Housekeeping/Environmental Services', 'Support/Ancillary', 1),
        ('Catering and Nutrition', 'Support/Ancillary', 1),
        ('Security', 'Support/Ancillary', 3),
        ('IT/Technology', 'Support/Ancillary', 3),
        ('Transport Services', 'Support/Ancillary', 3),
    ]
    for name, category, priority in department_data:
        priority_obj = PriorityLevel.objects.get(level=priority)
        Department.objects.get_or_create(name=name, category=category, priority=priority_obj)
    print("Departments loaded.")

if __name__ == "__main__":
    load_priority_levels()
    load_departments()
    print("Data loading complete.")
