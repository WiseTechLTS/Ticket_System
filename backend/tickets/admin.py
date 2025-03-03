from django.contrib import admin
from django.utils.html import format_html
from .models import PriorityLevel, MainDepartment, SubDepartment, Ticket

@admin.register(PriorityLevel)
class PriorityLevelAdmin(admin.ModelAdmin):
    list_display = ('level', 'description')
    ordering = ('level',)

@admin.register(MainDepartment)
class MainDepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(SubDepartment)
class SubDepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'main_department', 'priority')
    list_filter = ('main_department', 'priority')
    search_fields = ('name',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('title', 'sub_department', 'status', 'created_at', 'thumbnail')
    list_filter = ('status', 'sub_department')
    search_fields = ('title', 'issue')
    date_hierarchy = 'created_at'

    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 50px;" />',
                obj.image.url
            )
        return ""
    thumbnail.short_description = "Image"
