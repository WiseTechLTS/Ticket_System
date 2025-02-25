"""
Management Command: seed_departments.py

This command seeds the database with a comprehensive list of Departments
and their associated SubDepartments. It leverages Django's get_or_create
to ensure idempotency and maintain a robust data structure across environments.
"""

from django.core.management.base import BaseCommand
from ticketing.models import Department, SubDepartment

class Command(BaseCommand):
    help = 'Seeds the database with the complete list of Departments and SubDepartments.'

    def handle(self, *args, **options):
        # Define the comprehensive seed data for Departments and SubDepartments.
        seed_data = [
            {
                'code': 'MED',
                'name': 'Medical Departments',
                'subdepartments': [
                    {'code': 'ED', 'name': 'Emergency Department (ED)', 'priority': '3'},
                    {'code': 'IP', 'name': 'Inpatient Department', 'priority': '2'},
                    {'code': 'OP', 'name': 'Outpatient Department', 'priority': '1'},
                ]
            },
            {
                'code': 'ADM',
                'name': 'Administrative Departments',
                'subdepartments': [
                    {'code': 'HR', 'name': 'Human Resources', 'priority': '2'},
                    {'code': 'FIN', 'name': 'Finance', 'priority': '2'},
                    {'code': 'IT', 'name': 'Information Technology', 'priority': '3'},
                ]
            },
            {
                'code': 'SUP',
                'name': 'Support Departments',
                'subdepartments': [
                    {'code': 'MAINT', 'name': 'Maintenance', 'priority': '1'},
                    {'code': 'SEC', 'name': 'Security', 'priority': '3'},
                    {'code': 'CUST', 'name': 'Custodial Services', 'priority': '1'},
                ]
            },
        ]

        # Iterate over each department in the seed data.
        for dept_data in seed_data:
            department, dept_created = Department.objects.get_or_create(
                code=dept_data['code'],
                defaults={'name': dept_data['name']}
            )
            if dept_created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created Department: {department.name} (Code: {department.code})"
                ))
            else:
                self.stdout.write(
                    f"Department {department.name} (Code: {department.code}) already exists."
                )

            # Iterate over the subdepartments for the current department.
            for subdept_data in dept_data['subdepartments']:
                subdepartment, subdept_created = SubDepartment.objects.get_or_create(
                    department=department,
                    code=subdept_data['code'],
                    defaults={
                        'name': subdept_data['name'],
                        'priority': subdept_data['priority']
                    }
                )
                if subdept_created:
                    self.stdout.write(self.style.SUCCESS(
                        f"Created SubDepartment: {subdepartment.name} under {department.name}"
                    ))
                else:
                    self.stdout.write(
                        f"SubDepartment {subdepartment.name} under {department.name} already exists."
                    )

        self.stdout.write(self.style.SUCCESS(
            "Successfully seeded all Department and SubDepartment data."
        ))
