import csv

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.serializers import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import is_admin, is_health_user, is_school_user
from audit.services import create_audit_log
from core.models import Student
from core.services import age_in_months_from_birth_date, scope_students_for_user
from immunization.models import Vaccine, VaccineDoseRule, VaccineScheduleVersion, VaccinationRecord
from immunization.serializers import (
    VaccineDoseRuleSerializer,
    VaccineScheduleVersionSerializer,
    VaccineSerializer,
    VaccinationRecordSerializer,
)
from immunization.services import build_student_immunization_status


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.RoleChoices.ADMIN)


class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.all().order_by('name')
    serializer_class = VaccineSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]


class VaccineScheduleVersionViewSet(viewsets.ModelViewSet):
    queryset = VaccineScheduleVersion.objects.all().order_by('-created_at')
    serializer_class = VaccineScheduleVersionSerializer
    permission_classes = [IsAdminRole]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        create_audit_log(self.request.user, 'schedule_created', 'VaccineScheduleVersion', instance.id, {'code': instance.code})

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        create_audit_log(self.request.user, 'schedule_updated', 'VaccineScheduleVersion', instance.id, {'code': instance.code})


class VaccineDoseRuleViewSet(viewsets.ModelViewSet):
    queryset = VaccineDoseRule.objects.select_related('vaccine', 'schedule_version').all()
    serializer_class = VaccineDoseRuleSerializer
    permission_classes = [IsAdminRole]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        create_audit_log(
            self.request.user,
            'schedule_rule_created',
            'VaccineDoseRule',
            instance.id,
            {'schedule_id': instance.schedule_version_id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        create_audit_log(
            self.request.user,
            'schedule_rule_updated',
            'VaccineDoseRule',
            instance.id,
            {'schedule_id': instance.schedule_version_id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )


class VaccinationRecordViewSet(viewsets.ModelViewSet):
    queryset = VaccinationRecord.objects.select_related('student', 'vaccine', 'student__school').all()
    serializer_class = VaccinationRecordSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if is_admin(user) or is_health_user(user):
            return qs
        if is_school_user(user):
            return qs.filter(student__school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        student = serializer.validated_data.get('student')
        if not student:
            raise ValidationError({'student': 'Este campo e obrigatorio.'})
        if is_school_user(self.request.user) and student.school_id != self.request.user.school_id:
            raise PermissionDenied('Acesso negado para estudante de outra escola.')
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        create_audit_log(
            self.request.user,
            'vaccination_record_created',
            'VaccinationRecord',
            instance.id,
            {'student_id': instance.student_id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )

    def perform_update(self, serializer):
        record = serializer.instance
        if is_school_user(self.request.user) and record.student.school_id != self.request.user.school_id:
            raise PermissionDenied('Acesso negado para estudante de outra escola.')
        instance = serializer.save(updated_by=self.request.user)
        create_audit_log(
            self.request.user,
            'vaccination_record_updated',
            'VaccinationRecord',
            instance.id,
            {'student_id': instance.student_id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )

    def perform_destroy(self, instance):
        if is_school_user(self.request.user) and instance.student.school_id != self.request.user.school_id:
            raise PermissionDenied('Acesso negado para estudante de outra escola.')
        create_audit_log(
            self.request.user,
            'vaccination_record_deleted',
            'VaccinationRecord',
            instance.id,
            {'student_id': instance.student_id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )
        instance.delete()


class ScheduleRulesView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, schedule_id):
        schedule = get_object_or_404(VaccineScheduleVersion, id=schedule_id)
        rules = schedule.rules.select_related('vaccine').all().order_by('vaccine__name', 'dose_number')
        serializer = VaccineDoseRuleSerializer(rules, many=True)
        return Response(serializer.data)

    def post(self, request, schedule_id):
        schedule = get_object_or_404(VaccineScheduleVersion, id=schedule_id)
        payload = request.data.copy()
        payload['schedule_version'] = schedule.id
        serializer = VaccineDoseRuleSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user, updated_by=request.user)
        create_audit_log(
            request.user,
            'schedule_rule_created',
            'VaccineDoseRule',
            instance.id,
            {'schedule_id': schedule.id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ScheduleRuleDetailView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, schedule_id, rule_id):
        rule = get_object_or_404(VaccineDoseRule, id=rule_id, schedule_version_id=schedule_id)
        serializer = VaccineDoseRuleSerializer(rule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(updated_by=request.user)
        create_audit_log(
            request.user,
            'schedule_rule_updated',
            'VaccineDoseRule',
            instance.id,
            {'schedule_id': schedule_id, 'vaccine_id': instance.vaccine_id, 'dose_number': instance.dose_number},
        )
        return Response(serializer.data)

    def delete(self, request, schedule_id, rule_id):
        rule = get_object_or_404(VaccineDoseRule, id=rule_id, schedule_version_id=schedule_id)
        create_audit_log(
            request.user,
            'schedule_rule_deleted',
            'VaccineDoseRule',
            rule.id,
            {'schedule_id': schedule_id, 'vaccine_id': rule.vaccine_id, 'dose_number': rule.dose_number},
        )
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _filter_students_for_export(request, students):
    q = request.query_params.get('q')
    school_id = request.query_params.get('schoolId')
    status_filter = request.query_params.get('status')
    age_min = request.query_params.get('ageMin')
    age_max = request.query_params.get('ageMax')

    result = []
    for student in students:
        if q and q.lower() not in student.full_name.lower():
            continue
        if school_id and str(student.school_id) != str(school_id):
            continue

        age_months = age_in_months_from_birth_date(student.birth_date)
        if age_min and age_months < int(age_min):
            continue
        if age_max and age_months > int(age_max):
            continue

        status_data = build_student_immunization_status(student)
        if status_filter and status_data['status'] != status_filter:
            continue

        result.append((student, status_data))

    return result


class ExportStudentsPendingCsvView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (is_admin(user) or is_health_user(user) or is_school_user(user)):
            raise PermissionDenied('Sem permissao para exportacao.')

        students = scope_students_for_user(user, Student.objects.select_related('school').all())
        rows = _filter_students_for_export(request, students)

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="students_pending.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                'student_id',
                'student_name',
                'school',
                'status',
                'age_months',
                'vaccine_code',
                'vaccine_name',
                'dose_number',
                'pending_status',
            ]
        )

        for student, status_data in rows:
            if not status_data['pending']:
                continue
            for pending in status_data['pending']:
                writer.writerow(
                    [
                        student.id,
                        student.full_name,
                        student.school.name,
                        status_data['status'],
                        status_data['ageMonths'],
                        pending['vaccineCode'],
                        pending['vaccineName'],
                        pending['doseNumber'],
                        pending['status'],
                    ]
                )

        return response
