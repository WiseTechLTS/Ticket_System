from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

User = get_user_model()

class Department(models.Model):
    """
    Represents a high-level department (e.g., Medical, Administrative, Support).
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Internal code for the department (e.g., 'Medical')."
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name for the department (e.g., 'Medical Departments')."
    )

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
    
    def __str__(self):
        return self.name


class SubDepartment(models.Model):
    """
    Represents a sub-department linked to a Department.
    Each sub-department has an associated priority level.
    """
    PRIORITY_CHOICES = [
        ('3', 'Level 3 (Highest)'),
        ('2', 'Level 2 (Medium)'),
        ('1', 'Level 1 (Lowest)'),
    ]

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='subdepartments',
        help_text="The parent department for this sub-department."
    )
    code = models.CharField(
        max_length=50,
        help_text="Internal code for the sub-department (e.g., 'ED')."
    )
    name = models.CharField(
        max_length=100,
        help_text="Display name for the sub-department (e.g., 'Emergency Department (ED)')."
    )
    priority = models.CharField(
        max_length=1,
        choices=PRIORITY_CHOICES,
        help_text="Priority level for this sub-department based on the color-coded system."
    )

    class Meta:
        unique_together = ('department', 'code')
        verbose_name = "Sub-Department"
        verbose_name_plural = "Sub-Departments"

    def __str__(self):
        return f"{self.name} ({self.department.code})"


class Ticket(models.Model):
    """
    A support ticket that references a Department and a SubDepartment.
    The ticket's priority is automatically determined by the sub-department.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who submitted this ticket."
    )
    name = models.CharField(
        max_length=100,
        help_text="Name of the submitter."
    )
    email = models.EmailField(
        help_text="Email of the submitter."
    )
    phone = models.CharField(
        max_length=20,
        help_text="Phone number of the submitter."
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        help_text="Select the parent department."
    )
    sub_department = models.ForeignKey(
        SubDepartment,
        on_delete=models.PROTECT,
        help_text="Select the sub-department corresponding to the chosen department."
    )
    issue = models.TextField(
        help_text="Describe the issue or request."
    )
    screenshot = models.ImageField(
        upload_to='ticket_screenshots/',
        null=True,
        blank=True,
        help_text="Optional screenshot."
    )
    # The priority is automatically assigned from the selected sub-department.
    priority = models.CharField(
        max_length=1,
        editable=False,
        choices=SubDepartment.PRIORITY_CHOICES,
        help_text="Priority level auto-assigned from the sub-department."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket #{self.pk} - {self.name}"

    def clean(self):
        """
        Validates that the selected sub-department belongs to the chosen department,
        and automatically assigns the ticket's priority.
        """
        super().clean()
        # Ensure the sub-department is linked to the chosen department.
        if self.sub_department.department != self.department:
            raise ValidationError(
                "The selected sub-department does not belong to the chosen department."
            )
        # Automatically assign the ticket's priority.
        self.priority = self.sub_department.priority

    def save(self, *args, **kwargs):
        """
        Calls full_clean() to enforce validations before saving.
        """
        self.full_clean()
        super().save(*args, **kwargs)
