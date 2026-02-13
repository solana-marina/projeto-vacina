from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import has_dashboard_school_access, has_health_dashboard_access, is_school_user
from analytics_app.models import DEFAULT_AGE_BUCKETS, DashboardPreference
from analytics_app.services import (
    build_coverage_by_school,
    build_pending_age_distribution,
    build_ranking,
    filter_students_for_dashboard,
    get_user_age_buckets,
    normalize_age_buckets,
)
from core.models import Student
from core.services import scope_students_for_user


class DashboardFiltersMixin:
    def _get_filtered_students(self, request):
        students = list(scope_students_for_user(request.user, Student.objects.select_related('school').all()))

        school_id = request.query_params.get('schoolId')
        if school_id and is_school_user(request.user) and str(request.user.school_id) != str(school_id):
            raise PermissionDenied('Usuario de escola nao pode consultar outra escola.')

        try:
            return filter_students_for_dashboard(
                students,
                q=request.query_params.get('q'),
                school_id=school_id,
                status=request.query_params.get('status'),
                age_min=request.query_params.get('ageMin'),
                age_max=request.query_params.get('ageMax'),
                sex=request.query_params.get('sex'),
                vaccine_id=request.query_params.get('vaccineId'),
            )
        except (TypeError, ValueError):
            raise ValidationError({'detail': 'ageMin, ageMax e vaccineId devem ser valores numéricos válidos.'})


class SchoolCoverageDashboardView(DashboardFiltersMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_dashboard_school_access(request.user):
            raise PermissionDenied('Sem permissao para dashboard de cobertura.')

        data = build_coverage_by_school(
            self._get_filtered_students(request),
            vaccine_id=request.query_params.get('vaccineId'),
        )
        return Response({'items': data})


class SchoolRankingDashboardView(DashboardFiltersMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_health_dashboard_access(request.user):
            raise PermissionDenied('Sem permissao para dashboard de ranking.')

        data = build_ranking(
            self._get_filtered_students(request),
            vaccine_id=request.query_params.get('vaccineId'),
        )
        return Response({'items': data})


class AgeDistributionDashboardView(DashboardFiltersMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_health_dashboard_access(request.user):
            raise PermissionDenied('Sem permissao para dashboard de faixa etaria.')

        age_buckets = get_user_age_buckets(request.user)
        data = build_pending_age_distribution(
            self._get_filtered_students(request),
            age_buckets=age_buckets,
            vaccine_id=request.query_params.get('vaccineId'),
        )
        return Response({'items': data, 'ageBuckets': age_buckets})


class DashboardAgeBucketsPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_health_dashboard_access(request.user):
            raise PermissionDenied('Sem permissao para preferencias de dashboard.')
        buckets = get_user_age_buckets(request.user)
        return Response({'ageBuckets': buckets})

    def put(self, request):
        if not has_health_dashboard_access(request.user):
            raise PermissionDenied('Sem permissao para preferencias de dashboard.')

        raw_buckets = request.data.get('ageBuckets')
        if not isinstance(raw_buckets, list):
            raise ValidationError({'ageBuckets': 'Formato invalido. Informe uma lista de faixas etarias.'})

        normalized = normalize_age_buckets(raw_buckets)
        if len(normalized) != len(raw_buckets):
            raise ValidationError({'ageBuckets': 'Uma ou mais faixas etarias sao invalidas.'})

        for index in range(1, len(normalized)):
            previous = normalized[index - 1]
            current = normalized[index]
            if current['minMonths'] <= previous['maxMonths']:
                raise ValidationError({'ageBuckets': 'Faixas etarias nao podem se sobrepor.'})

        preference, _ = DashboardPreference.objects.get_or_create(
            user=request.user,
            defaults={'age_buckets_json': DEFAULT_AGE_BUCKETS},
        )
        preference.age_buckets_json = normalized
        preference.save(update_fields=['age_buckets_json', 'updated_at'])
        return Response({'ageBuckets': normalized})
