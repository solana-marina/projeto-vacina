from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_logs')
    action = models.CharField(max_length=120)
    entity_type = models.CharField(max_length=120)
    entity_id = models.CharField(max_length=120)
    timestamp = models.DateTimeField(auto_now_add=True)
    details_json = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.action} {self.entity_type}#{self.entity_id}'


class ErrorLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='error_logs',
    )
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=255)
    status_code = models.PositiveIntegerField()
    message = models.TextField()
    trace_id = models.CharField(max_length=64, db_index=True)
    details_json = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.status_code} {self.method} {self.path} ({self.trace_id})'
