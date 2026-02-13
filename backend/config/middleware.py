import traceback
import uuid

from django.utils.deprecation import MiddlewareMixin

from audit.services import create_error_log


class TraceIdMiddleware(MiddlewareMixin):
    def process_request(self, request):
        incoming = request.headers.get('X-Trace-Id')
        request.trace_id = incoming or uuid.uuid4().hex

    def process_response(self, request, response):
        trace_id = getattr(request, 'trace_id', None)
        if trace_id:
            response['X-Trace-Id'] = trace_id
        return response


class UnhandledExceptionLoggingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        trace_id = getattr(request, 'trace_id', uuid.uuid4().hex)
        user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

        try:
            create_error_log(
                actor=user,
                method=request.method,
                path=request.path,
                status_code=500,
                message=str(exception),
                trace_id=trace_id,
                details={'traceback': traceback.format_exc()},
            )
        except Exception:
            pass

        return None
