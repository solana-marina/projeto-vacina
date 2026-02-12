from django.contrib import admin

from immunization.models import Vaccine, VaccineDoseRule, VaccineScheduleVersion, VaccinationRecord


@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name')
    search_fields = ('code', 'name')


@admin.register(VaccineScheduleVersion)
class VaccineScheduleVersionAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('code', 'name')


@admin.register(VaccineDoseRule)
class VaccineDoseRuleAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'schedule_version',
        'vaccine',
        'dose_number',
        'recommended_min_age_months',
        'recommended_max_age_months',
    )
    list_filter = ('schedule_version', 'vaccine')


@admin.register(VaccinationRecord)
class VaccinationRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'vaccine', 'dose_number', 'application_date', 'source')
    list_filter = ('source', 'vaccine')
    search_fields = ('student__full_name',)
