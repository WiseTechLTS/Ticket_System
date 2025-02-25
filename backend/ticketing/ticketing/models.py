from django.db import models

from django.db import models

class PriorityLevel(models.Model):
    LEVEL_CHOICES = [
        (1, 'Level 1 (Lowest)'),
        (2, 'Level 2 (Medium)'),
        (3, 'Level 3 (Highest)')
    ]
    level = models.IntegerField(choices=LEVEL_CHOICES, unique=True)
    
    def __str__(self):
        return dict(self.LEVEL_CHOICES)[self.level]

class Department(models.Model):
    CATEGORY_CHOICES = [
        ('Medical', 'Medical'),
        ('Administrative', 'Administrative'),
        ('Support/Ancillary', 'Support/Ancillary')
    ]
    
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    priority = models.ForeignKey(PriorityLevel, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.name} ({self.category})"

class Ticket(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    priority = models.ForeignKey(PriorityLevel, on_delete=models.CASCADE)
    issue = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='tickets/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    # New field for the admin-selected fix
    ADMIN_FIX_CHOICES = [
        ("restart_ehr", "Restart the EHR server, clear caches, and check network load."),
        ("verify_devices", "Verify device configurations and network connectivity; update firmware if needed."),
        ("review_logs", "Review system logs, reschedule maintenance, and test system responsiveness."),
        ("optimize_wifi", "Optimize router placement, update firmware, and check for interference."),
        ("investigate_security", "Investigate login logs, enforce strong authentication, and update security protocols."),
        ("restart_printer", "Restart the printer, verify network settings, and check for driver updates."),
        ("upgrade_network", "Analyze network bandwidth usage and consider hardware upgrades or traffic shaping."),
        ("rollback_update", "Rollback the update, apply patches after thorough testing, and document changes."),
        ("reconfigure_network", "Reconfigure network segments, test connectivity, and consult network logs."),
        ("restart_vpn", "Restart VPN services, review remote access policies, and verify firewall rules."),
    ]
    admin_fix = models.CharField(
        max_length=50,
        choices=ADMIN_FIX_CHOICES,
        blank=True,
        null=True,
        help_text="Select the fix implemented by the admin."
    )

    def __str__(self):
        return f"{self.name} - {self.department.name} - {self.priority}"
