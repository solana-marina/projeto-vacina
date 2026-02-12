from rest_framework import serializers

from core.models import School, Student
from core.services import age_in_months_from_birth_date
from immunization.services import build_student_immunization_status


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = [
            'id',
            'name',
            'inep_code',
            'address',
            'territory_ref',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    age_months = serializers.SerializerMethodField()
    current_status = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'school',
            'school_name',
            'full_name',
            'birth_date',
            'guardian_name',
            'guardian_contact',
            'class_group',
            'age_months',
            'current_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'age_months', 'current_status', 'school_name']

    def get_age_months(self, obj):
        return age_in_months_from_birth_date(obj.birth_date)

    def get_current_status(self, obj):
        status_cache = self.context.get('status_cache')
        if status_cache and obj.id in status_cache:
            return status_cache[obj.id]['status']
        return build_student_immunization_status(obj)['status']
