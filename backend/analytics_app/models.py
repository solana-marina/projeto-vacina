from django.conf import settings
from django.db import models


DEFAULT_AGE_BUCKETS = [
    {'label': 'Recem-nascido (0 a 28 dias)', 'minMonths': 0, 'maxMonths': 0},
    {'label': 'Lactente (1 a 23 meses)', 'minMonths': 1, 'maxMonths': 23},
    {'label': 'Pre-escolar (2 a 4 anos)', 'minMonths': 24, 'maxMonths': 59},
    {'label': 'Escolar (5 a 9 anos)', 'minMonths': 60, 'maxMonths': 119},
    {'label': 'Adolescente (10 a 19 anos)', 'minMonths': 120, 'maxMonths': 239},
    {'label': 'Adulto (20 anos ou mais)', 'minMonths': 240, 'maxMonths': 999},
]


class DashboardPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_preference')
    age_buckets_json = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Preferencias de dashboard de {self.user.email}'
