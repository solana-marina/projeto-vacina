from rest_framework import serializers

from immunization.models import Vaccine, VaccineDoseRule, VaccineScheduleVersion, VaccinationRecord


class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = ['id', 'code', 'name']
        read_only_fields = ['id']


class VaccineDoseRuleSerializer(serializers.ModelSerializer):
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)

    class Meta:
        model = VaccineDoseRule
        fields = [
            'id',
            'schedule_version',
            'vaccine',
            'vaccine_name',
            'dose_number',
            'recommended_min_age_months',
            'recommended_max_age_months',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vaccine_name']

    def validate(self, attrs):
        min_age = attrs.get('recommended_min_age_months', getattr(self.instance, 'recommended_min_age_months', None))
        max_age = attrs.get('recommended_max_age_months', getattr(self.instance, 'recommended_max_age_months', None))
        if min_age is not None and max_age is not None and min_age > max_age:
            raise serializers.ValidationError('recommended_min_age_months nao pode ser maior que recommended_max_age_months.')
        return attrs


class VaccineScheduleVersionSerializer(serializers.ModelSerializer):
    rules_count = serializers.IntegerField(source='rules.count', read_only=True)

    class Meta:
        model = VaccineScheduleVersion
        fields = ['id', 'code', 'name', 'is_active', 'created_at', 'rules_count']
        read_only_fields = ['id', 'created_at', 'rules_count']


class VaccinationRecordSerializer(serializers.ModelSerializer):
    vaccine_name = serializers.CharField(source='vaccine.name', read_only=True)

    class Meta:
        model = VaccinationRecord
        fields = [
            'id',
            'student',
            'vaccine',
            'vaccine_name',
            'dose_number',
            'application_date',
            'source',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vaccine_name']
        extra_kwargs = {
            'student': {'required': False},
        }
