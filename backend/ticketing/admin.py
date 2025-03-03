from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Ticket, Department, PriorityLevel

class TicketAdminForm(forms.ModelForm):
    class Meta:
        model = Ticket
        exclude = ['priority']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    form = TicketAdminForm
    readonly_fields = ('priority',)
    list_display = ('id', 'name', 'email', 'department', 'priority', 'admin_fix', 'created_at', 'image_preview')
    list_filter = ('department', 'priority', 'created_at')
    search_fields = ('name', 'email', 'issue')
    ordering = ('-created_at',)
    actions = ['archive_tickets', 'delete_selected_tickets']
    fields = ('name', 'email', 'department', 'priority', 'issue', 'image', 'image_url', 'admin_fix')

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "-"
    image_preview.short_description = 'Image Preview'

    def archive_tickets(self, request, queryset):
        updated = queryset.update(priority=1)
        self.message_user(request, f"Successfully archived {updated} ticket(s).")
    archive_tickets.short_description = "Archive selected tickets"

    def delete_selected_tickets(self, request, queryset):
        deleted_count = queryset.delete()[0]
        self.message_user(request, f"Successfully deleted {deleted_count} ticket(s).")
    delete_selected_tickets.short_description = "Delete selected tickets"

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'priority')
    search_fields = ('name', 'category')

@admin.register(PriorityLevel)
class PriorityLevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'level')
    search_fields = ('level',)
