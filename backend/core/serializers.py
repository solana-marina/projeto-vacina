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
            'sex',
            'guardian_name',
            'guardian_contact',
            'age_months',
            'current_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'age_months', 'current_status', 'school_name']

    def validate_sex(self, value):
        if value not in {Student.SexChoices.FEMALE, Student.SexChoices.MALE, Student.SexChoices.NOT_INFORMED}:
            raise serializers.ValidationError('Sexo invalido.')
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        sex = attrs.get('sex', getattr(self.instance, 'sex', None))
        if self.instance is None and sex not in {Student.SexChoices.FEMALE, Student.SexChoices.MALE}:
            raise serializers.ValidationError({'sex': 'Novos cadastros devem informar sexo como F ou M.'})
        if self.instance is not None and 'sex' in attrs and sex == Student.SexChoices.NOT_INFORMED:
            raise serializers.ValidationError({'sex': 'Atualize o sexo para F ou M.'})
        return attrs

    def get_age_months(self, obj):
        return age_in_months_from_birth_date(obj.birth_date)

    def get_current_status(self, obj):
        status_cache = self.context.get('status_cache')
        if status_cache and obj.id in status_cache:
            return status_cache[obj.id]['status']
        return build_student_immunization_status(obj)['status']
