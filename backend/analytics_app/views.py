from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import has_dashboard_school_access, has_health_dashboard_access, is_school_user
from analytics_app.services import build_coverage_by_school, build_pending_age_distribution, build_ranking
from core.models import Student
from core.services import scope_students_for_user


class SchoolCoverageDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_dashboard_school_access(request.user):
            raise PermissionDenied('Sem permissao para dashboard de cobertura.')

        students = scope_students_for_user(request.user, Student.objects.select_related('school').all())
        school_id = request.query_params.get('schoolId')
        if school_id:
            if is_school_user(request.user) and str(request.user.school_id) != str(school_id):
                raise PermissionDenied('Usuario de escola nao pode consultar outra escola.')
            students = students.filter(school_id=school_id)

        data = build_coverage_by_school(list(students))
        return Response({'items': data})


class SchoolRankingDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_health_dashboard_access(request.user):
            raise PermissionDenied('Sem permissao para dashboard de ranking.')

        students = scope_students_for_user(request.user, Student.objects.select_related('school').all())
        data = build_ranking(list(students))
        return Response({'items': data})


class AgeDistributionDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not has_health_dashboard_access(request.user):
            raise PermissionDenied('Sem permissao para dashboard de faixa etaria.')

        students = scope_students_for_user(request.user, Student.objects.select_related('school').all())
        school_id = request.query_params.get('schoolId')
        if school_id:
            students = students.filter(school_id=school_id)

        data = build_pending_age_distribution(list(students))
        return Response({'items': data})
