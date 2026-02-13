from __future__ import annotations

from rest_framework.views import exception_handler

from audit.services import create_error_log


MAX_MESSAGE_LEN = 2000


def _extract_message(payload):
    if payload is None:
        return 'Erro de API.'
    if isinstance(payload, str):
        return payload
    if isinstance(payload, list):
        return '; '.join(str(item) for item in payload)
    if isinstance(payload, dict):
        if 'detail' in payload:
            return str(payload['detail'])
        if 'non_field_errors' in payload:
            value = payload['non_field_errors']
            if isinstance(value, list):
                return '; '.join(str(item) for item in value)
            return str(value)
        return '; '.join(f'{key}: {value}' for key, value in payload.items())
    return str(payload)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get('request')

    if response is None or request is None:
        return response

    trace_id = getattr(request, 'trace_id', '')
    if trace_id:
        response['X-Trace-Id'] = trace_id

    status_code = response.status_code
    if status_code >= 400:
        try:
            message = _extract_message(response.data)[:MAX_MESSAGE_LEN]
            user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None
            create_error_log(
                actor=user,
                method=request.method,
                path=request.path,
                status_code=status_code,
                message=message,
                trace_id=trace_id or 'n/a',
                details={'response': response.data},
            )
        except Exception:
            pass

    if isinstance(response.data, dict):
        response.data.setdefault('trace_id', trace_id)

    return response
