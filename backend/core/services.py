from django.db.models import QuerySet
from django.utils import timezone

from accounts.permissions import is_admin, is_health_user, is_school_user
from core.models import Student


def age_in_months_from_birth_date(birth_date):
    today = timezone.localdate()
    months = (today.year - birth_date.year) * 12 + (today.month - birth_date.month)
    if today.day < birth_date.day:
        months -= 1
    return max(months, 0)


def scope_students_for_user(user, queryset: QuerySet | None = None) -> QuerySet:
    qs = queryset if queryset is not None else Student.objects.all()
    if is_admin(user) or is_health_user(user):
        return qs
    if is_school_user(user):
        return qs.filter(school_id=user.school_id)
    return qs.none()
