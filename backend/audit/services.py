from audit.models import AuditLog


def create_audit_log(actor, action, entity_type, entity_id, details=None):
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details_json=details or {},
    )
