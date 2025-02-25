from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Ticket, Department, PriorityLevel

class TicketAdminForm(forms.ModelForm):
    """
    This ModelForm excludes the priority field so that
    it will be automatically assigned based on the department.
    """
    class Meta:
        model = Ticket
        # Exclude 'priority' to prevent manual selection in the admin.
        exclude = ['priority']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    form = TicketAdminForm
    # Make priority read-only so it is visible but not editable.
    readonly_fields = ('priority',)
    list_display = (
        'id', 
        'name', 
        'email', 
        'department', 
        'priority', 
        'admin_fix',  # Display the admin-selected fix.
        'created_at', 
        'image_preview'
    )
    list_filter = ('department', 'priority', 'created_at')
    search_fields = ('name', 'email', 'issue')
    ordering = ('-created_at',)
    actions = ['archive_tickets']
    # Include admin_fix in the form fields.
    fields = ('name', 'email', 'department', 'priority', 'issue', 'image', 'image_url', 'admin_fix')

    def save_model(self, request, obj, form, change):
        """
        Automatically sets priority to the department's priority
        before saving the Ticket.
        """
        # Assign priority from the selected department.
        obj.priority = obj.department.priority
        super().save_model(request, obj, form, change)

    def image_preview(self, obj):
        """Displays a thumbnail of the uploaded image."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px;" />', 
                obj.image.url
            )
        return "-"
    image_preview.short_description = 'Image Preview'

    def archive_tickets(self, request, queryset):
        """Custom action to archive selected tickets by setting priority to 1."""
        updated = queryset.update(priority=1)
        self.message_user(request, f"Successfully archived {updated} ticket(s).")
    archive_tickets.short_description = "Archive selected tickets"

    class Media:
        # Optionally include custom JavaScript if desired.
        js = ('ticketing/js/priority_chained.js',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'priority')
    search_fields = ('name', 'category')

@admin.register(PriorityLevel)
class PriorityLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'level')
    search_fields = ('level',)
