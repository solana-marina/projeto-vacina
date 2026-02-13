from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, viewsets

from accounts.permissions import is_admin
from audit.models import AuditLog, ErrorLog
from audit.serializers import AuditLogSerializer, ErrorLogSerializer


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_admin(request.user))


def _parse_dt(value):
    parsed = parse_datetime(value)
    if parsed:
        return parsed
    parsed_date = parse_date(value)
    if parsed_date:
        combined = timezone.datetime.combine(parsed_date, timezone.datetime.min.time())
        return timezone.make_aware(combined)
    return None


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminRole]
    queryset = AuditLog.objects.select_related('actor').all().order_by('-timestamp')

    def get_queryset(self):
        qs = self.queryset
        action = self.request.query_params.get('action')
        entity_type = self.request.query_params.get('entityType')
        actor_id = self.request.query_params.get('actorId')
        date_from = self.request.query_params.get('dateFrom')
        date_to = self.request.query_params.get('dateTo')
        q = self.request.query_params.get('q')

        if action:
            qs = qs.filter(action=action)
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        if actor_id:
            qs = qs.filter(actor_id=actor_id)
        if date_from:
            parsed = _parse_dt(date_from)
            if parsed:
                qs = qs.filter(timestamp__gte=parsed)
        if date_to:
            parsed = _parse_dt(date_to)
            if parsed:
                qs = qs.filter(timestamp__lte=parsed)
        if q:
            qs = qs.filter(
                Q(action__icontains=q)
                | Q(entity_type__icontains=q)
                | Q(entity_id__icontains=q)
                | Q(actor__email__icontains=q)
            )

        return qs


class ErrorLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ErrorLogSerializer
    permission_classes = [IsAdminRole]
    queryset = ErrorLog.objects.select_related('actor').all().order_by('-timestamp')

    def get_queryset(self):
        qs = self.queryset
        status_code = self.request.query_params.get('statusCode')
        path = self.request.query_params.get('path')
        date_from = self.request.query_params.get('dateFrom')
        date_to = self.request.query_params.get('dateTo')
        q = self.request.query_params.get('q')

        if status_code:
            qs = qs.filter(status_code=status_code)
        if path:
            qs = qs.filter(path__icontains=path)
        if date_from:
            parsed = _parse_dt(date_from)
            if parsed:
                qs = qs.filter(timestamp__gte=parsed)
        if date_to:
            parsed = _parse_dt(date_to)
            if parsed:
                qs = qs.filter(timestamp__lte=parsed)
        if q:
            qs = qs.filter(
                Q(message__icontains=q)
                | Q(trace_id__icontains=q)
                | Q(path__icontains=q)
                | Q(actor__email__icontains=q)
            )

        return qs
