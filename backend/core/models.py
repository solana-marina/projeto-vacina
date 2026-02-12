from django.conf import settings
from django.db import models


class AuditStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_updated',
    )

    class Meta:
        abstract = True


class School(AuditStampedModel):
    name = models.CharField(max_length=255)
    inep_code = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    territory_ref = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name


class Student(AuditStampedModel):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    full_name = models.CharField(max_length=255)
    birth_date = models.DateField()
    guardian_name = models.CharField(max_length=255, blank=True)
    guardian_contact = models.CharField(max_length=100, blank=True)
    class_group = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return self.full_name
