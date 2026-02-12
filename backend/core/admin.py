from django.contrib import admin

from core.models import School, Student


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'inep_code', 'territory_ref')
    search_fields = ('name', 'inep_code')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'school', 'birth_date', 'class_group')
    list_filter = ('school',)
    search_fields = ('full_name',)
