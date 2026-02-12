from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.permissions import is_school_user
from audit.services import create_audit_log
from core.models import School, Student
from core.permissions import SchoolPermission, StudentPermission
from core.serializers import SchoolSerializer, StudentSerializer
from core.services import age_in_months_from_birth_date, scope_students_for_user
from immunization.serializers import VaccinationRecordSerializer
from immunization.services import build_student_immunization_status


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all().order_by('name')
    serializer_class = SchoolSerializer
    permission_classes = [SchoolPermission]

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        create_audit_log(self.request.user, 'school_created', 'School', instance.id, {'name': instance.name})

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        create_audit_log(self.request.user, 'school_updated', 'School', instance.id, {'name': instance.name})


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school').all()
    serializer_class = StudentSerializer
    permission_classes = [StudentPermission]

    def get_queryset(self):
        return scope_students_for_user(self.request.user, self.queryset)

    def _apply_filters(self, students):
        q = self.request.query_params.get('q')
        school_id = self.request.query_params.get('schoolId')
        status_filter = self.request.query_params.get('status')
        age_min = self.request.query_params.get('ageMin')
        age_max = self.request.query_params.get('ageMax')

        if q:
            students = [student for student in students if q.lower() in student.full_name.lower()]

        if school_id:
            if is_school_user(self.request.user) and str(self.request.user.school_id) != str(school_id):
                return [], {}
            students = [student for student in students if str(student.school_id) == str(school_id)]

        status_cache = {}
        filtered_students = []

        for student in students:
            age_months = age_in_months_from_birth_date(student.birth_date)
            if age_min and age_months < int(age_min):
                continue
            if age_max and age_months > int(age_max):
                continue

            status_data = build_student_immunization_status(student)
            status_cache[student.id] = status_data
            if status_filter and status_data['status'] != status_filter:
                continue
            filtered_students.append(student)

        return filtered_students, status_cache

    def list(self, request, *args, **kwargs):
        students = list(self.get_queryset())
        filtered_students, status_cache = self._apply_filters(students)
        page = self.paginate_queryset(filtered_students)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request, 'status_cache': status_cache})
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(filtered_students, many=True, context={'request': request, 'status_cache': status_cache})
        return Response(serializer.data)

    def perform_create(self, serializer):
        school = serializer.validated_data.get('school')
        if is_school_user(self.request.user) and school.id != self.request.user.school_id:
            raise PermissionDenied('Usuario de escola so pode criar estudante na propria escola.')
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        create_audit_log(self.request.user, 'student_created', 'Student', instance.id, {'full_name': instance.full_name})

    def perform_update(self, serializer):
        instance = serializer.instance
        if is_school_user(self.request.user) and instance.school_id != self.request.user.school_id:
            raise PermissionDenied('Usuario de escola so pode editar estudante da propria escola.')
        updated = serializer.save(updated_by=self.request.user)
        create_audit_log(self.request.user, 'student_updated', 'Student', updated.id, {'full_name': updated.full_name})

    def perform_destroy(self, instance):
        if is_school_user(self.request.user) and instance.school_id != self.request.user.school_id:
            raise PermissionDenied('Usuario de escola so pode remover estudante da propria escola.')
        create_audit_log(self.request.user, 'student_deleted', 'Student', instance.id, {'full_name': instance.full_name})
        instance.delete()

    @action(detail=True, methods=['get'], url_path='immunization-status')
    def immunization_status(self, request, pk=None):
        student = self.get_object()
        data = build_student_immunization_status(student)
        return Response(data)

    @action(detail=True, methods=['get', 'post'], url_path='vaccinations')
    def vaccinations(self, request, pk=None):
        student = self.get_object()

        if request.method == 'GET':
            records = student.vaccination_records.select_related('vaccine').all().order_by('vaccine__name', 'dose_number')
            serializer = VaccinationRecordSerializer(records, many=True)
            return Response(serializer.data)

        payload = request.data.copy()
        payload['student'] = student.id
        serializer = VaccinationRecordSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        if is_school_user(request.user) and student.school_id != request.user.school_id:
            return Response({'detail': 'Acesso negado para outra escola.'}, status=status.HTTP_403_FORBIDDEN)
        record = serializer.save(student=student, created_by=request.user, updated_by=request.user)
        create_audit_log(
            request.user,
            'vaccination_record_created',
            'VaccinationRecord',
            record.id,
            {'student_id': student.id, 'vaccine_id': record.vaccine_id, 'dose_number': record.dose_number},
        )
        return Response(VaccinationRecordSerializer(record).data, status=status.HTTP_201_CREATED)
