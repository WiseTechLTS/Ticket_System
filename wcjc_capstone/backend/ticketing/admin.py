from django.contrib import admin
from django.utils.html import format_html
from .models import Ticket

class TicketAdmin(admin.ModelAdmin):
    """
    Custom admin configuration for Ticket, including dynamic sub-department
    dropdowns, a screenshot thumbnail display sourced from the model file, 
    and a streamlined interface.
    """
    list_display = (
        'id', 'name', 'department', 'sub_department', 'thumbnail', 'priority', 'created_at'
    )
    list_filter = ('department', 'priority', 'created_at')
    search_fields = ('name', 'email', 'sub_department', 'issue')
    ordering = ('-created_at',)

    def thumbnail(self, obj):
        """
        Returns a rendered thumbnail of the screenshot file, if available.
        """
        if obj.screenshot:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px;" alt="Screenshot Thumbnail" />',
                obj.screenshot.url
            )
        return "-"
    thumbnail.short_description = "Thumbnail"

    class Media:
        # Reference a JS file that updates the sub_department field in real time.
        js = ('js/ticket_admin.js',)

admin.site.register(Ticket, TicketAdmin)
