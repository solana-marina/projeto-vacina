from django.contrib import admin

from analytics_app.models import DashboardPreference


@admin.register(DashboardPreference)
class DashboardPreferenceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'updated_at')
    search_fields = ('user__email',)
