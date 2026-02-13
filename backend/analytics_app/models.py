from django.conf import settings
from django.db import models


DEFAULT_AGE_BUCKETS = [
    {'label': '0-11', 'minMonths': 0, 'maxMonths': 11},
    {'label': '12-59', 'minMonths': 12, 'maxMonths': 59},
    {'label': '60-107', 'minMonths': 60, 'maxMonths': 107},
    {'label': '108-179', 'minMonths': 108, 'maxMonths': 179},
    {'label': '180+', 'minMonths': 180, 'maxMonths': 999},
]


class DashboardPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_preference')
    age_buckets_json = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Preferencias de dashboard de {self.user.email}'
