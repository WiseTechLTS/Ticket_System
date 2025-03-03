from django.db import models
from authentication.models import User  # Ensure your custom User model is imported

class PriorityLevel(models.Model):
    """
    Represents the priority levels used across subdepartments.
    Choices:
        - Level 3 (Highest)
        - Level 2 (Medium)
        - Level 1 (Lowest)
    """
    LEVEL_CHOICES = [
        (3, "Level 3 (Highest)"),
        (2, "Level 2 (Medium)"),
        (1, "Level 1 (Lowest)"),
    ]
    level = models.IntegerField(choices=LEVEL_CHOICES, unique=True)
    description = models.CharField(max_length=50)

    def __str__(self):
        return self.get_level_display()


class MainDepartment(models.Model):
    """
    Represents the three main categories of hospital departments:
    - Medical
    - Administrative
    - Support / Ancillary
    """
    DEPARTMENT_CHOICES = [
        ("Medical", "Medical"),
        ("Administrative", "Administrative"),
        ("Support/Ancillary", "Support / Ancillary"),
    ]
    name = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, unique=True)

    def __str__(self):
        return self.name


class SubDepartment(models.Model):
    """
    Represents a subdepartment within a MainDepartment.
    Each subdepartment is assigned a priority level.
    """
    name = models.CharField(max_length=255, unique=True)
    main_department = models.ForeignKey(
        MainDepartment,
        on_delete=models.CASCADE,
        related_name="sub_departments"
    )
    priority = models.ForeignKey(
        PriorityLevel,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sub_departments"
    )

    def __str__(self):
        return f"{self.name} ({self.main_department}) - {self.priority}"


class Ticket(models.Model):
    """
    Represents a service request or issue ticket.
    Each ticket is associated with a user and a subdepartment.
    Additional fields include first and last names, email,
    title, detailed issue description, image, status, and timestamps.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    title = models.CharField(max_length=255)
    issue = models.TextField()
    sub_department = models.ForeignKey(
        SubDepartment,
        on_delete=models.CASCADE,
        related_name="tickets"
    )
    PriorityLevel = models.ForeignKey(
        PriorityLevel,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tickets"
    )
    image = models.ImageField(upload_to="tickets/", null=True, blank=True)
    status = models.CharField(max_length=50, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
