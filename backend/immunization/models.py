from django.conf import settings
from django.db import models, transaction


class Vaccine(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class VaccineScheduleVersion(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='schedule_versions_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='schedule_versions_updated',
    )

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.is_active:
                VaccineScheduleVersion.objects.exclude(pk=self.pk).filter(is_active=True).update(is_active=False)
            super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.code} - {self.name}'


class VaccineDoseRule(models.Model):
    schedule_version = models.ForeignKey(VaccineScheduleVersion, on_delete=models.CASCADE, related_name='rules')
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE, related_name='dose_rules')
    dose_number = models.PositiveIntegerField()
    recommended_min_age_months = models.PositiveIntegerField()
    recommended_max_age_months = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='dose_rules_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='dose_rules_updated',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['schedule_version', 'vaccine', 'dose_number'],
                name='unique_schedule_vaccine_dose',
            )
        ]
        ordering = ['vaccine__name', 'dose_number']

    def __str__(self):
        return f'{self.schedule_version.code} - {self.vaccine.code} dose {self.dose_number}'


class VaccinationRecord(models.Model):
    class SourceChoices(models.TextChoices):
        INFORMADO_ESCOLA = 'INFORMADO_ESCOLA', 'Informado pela escola'
        CONFIRMADO_SAUDE = 'CONFIRMADO_SAUDE', 'Confirmado pela saude'

    student = models.ForeignKey('core.Student', on_delete=models.CASCADE, related_name='vaccination_records')
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE, related_name='vaccination_records')
    dose_number = models.PositiveIntegerField()
    application_date = models.DateField()
    source = models.CharField(max_length=30, choices=SourceChoices.choices)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='vaccination_records_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='vaccination_records_updated',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'vaccine', 'dose_number'],
                name='unique_student_vaccine_dose',
            )
        ]
        ordering = ['-application_date']

    def __str__(self):
        return f'{self.student.full_name} - {self.vaccine.code} dose {self.dose_number}'
