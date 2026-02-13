from rest_framework import serializers

from audit.models import AuditLog, ErrorLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor',
            'actor_email',
            'action',
            'entity_type',
            'entity_id',
            'timestamp',
            'details_json',
        ]
        read_only_fields = fields


class ErrorLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True)

    class Meta:
        model = ErrorLog
        fields = [
            'id',
            'actor',
            'actor_email',
            'method',
            'path',
            'status_code',
            'message',
            'trace_id',
            'details_json',
            'timestamp',
        ]
        read_only_fields = fields
