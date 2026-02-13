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
        validators = []
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
        schedule_version = attrs.get('schedule_version', getattr(self.instance, 'schedule_version', None))
        vaccine = attrs.get('vaccine', getattr(self.instance, 'vaccine', None))
        dose_number = attrs.get('dose_number', getattr(self.instance, 'dose_number', None))
        min_age = attrs.get('recommended_min_age_months', getattr(self.instance, 'recommended_min_age_months', None))
        max_age = attrs.get('recommended_max_age_months', getattr(self.instance, 'recommended_max_age_months', None))
        if min_age is not None and max_age is not None and min_age > max_age:
            raise serializers.ValidationError(
                'A idade mínima não pode ser maior que a idade máxima. Revise os valores informados.'
            )

        if schedule_version and vaccine and dose_number:
            duplicate_qs = VaccineDoseRule.objects.filter(
                schedule_version=schedule_version,
                vaccine=vaccine,
                dose_number=dose_number,
            )
            if self.instance:
                duplicate_qs = duplicate_qs.exclude(pk=self.instance.pk)
            if duplicate_qs.exists():
                raise serializers.ValidationError(
                    {
                        'non_field_errors': [
                            f'Já existe uma regra para a vacina {vaccine.code}, dose {dose_number}, na versão {schedule_version.code}. Edite a regra existente.'
                        ]
                    }
                )
        return attrs


class VaccineScheduleVersionSerializer(serializers.ModelSerializer):
    rules_count = serializers.IntegerField(source='rules.count', read_only=True)

    class Meta:
        model = VaccineScheduleVersion
        fields = ['id', 'code', 'name', 'is_active', 'created_at', 'rules_count']
        read_only_fields = ['id', 'created_at', 'rules_count']

    def validate(self, attrs):
        is_active = attrs.get('is_active')
        if self.instance and is_active is False and self.instance.is_active:
            has_another_active = VaccineScheduleVersion.objects.exclude(pk=self.instance.pk).filter(is_active=True).exists()
            if not has_another_active:
                raise serializers.ValidationError(
                    {'is_active': 'Não é permitido desativar o único calendário ativo. Ative outra versão para fazer a troca.'}
                )
        return attrs


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
