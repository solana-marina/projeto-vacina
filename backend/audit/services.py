from audit.models import AuditLog, ErrorLog


def create_audit_log(actor, action, entity_type, entity_id, details=None):
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details_json=details or {},
    )


def create_error_log(actor, method, path, status_code, message, trace_id, details=None):
    return ErrorLog.objects.create(
        actor=actor,
        method=method,
        path=path,
        status_code=status_code,
        message=message,
        trace_id=trace_id,
        details_json=details or {},
    )
