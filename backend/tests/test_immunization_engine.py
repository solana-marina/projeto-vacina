import datetime

import pytest
from django.utils import timezone

from core.models import Student
from immunization.services import build_student_immunization_status
from tests.factories import (
    SchoolFactory,
    StudentFactory,
    VaccinationRecordFactory,
    VaccineDoseRuleFactory,
    VaccineFactory,
    VaccineScheduleVersionFactory,
)


@pytest.fixture
def base_schedule():
    schedule = VaccineScheduleVersionFactory(is_active=True)

    vaccine_triplice = VaccineFactory(code='TRIPLICE_VIRAL', name='Triplice Viral')
    vaccine_dtp = VaccineFactory(code='DTP', name='DTP')
    vaccine_hep = VaccineFactory(code='HEPATITE_B', name='Hepatite B')
    vaccine_hpv = VaccineFactory(code='HPV', name='HPV')

    VaccineDoseRuleFactory(
        schedule_version=schedule,
        vaccine=vaccine_triplice,
        dose_number=1,
        recommended_min_age_months=12,
        recommended_max_age_months=15,
    )
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_dtp, dose_number=1, recommended_min_age_months=2, recommended_max_age_months=3)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_dtp, dose_number=2, recommended_min_age_months=4, recommended_max_age_months=5)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_dtp, dose_number=3, recommended_min_age_months=6, recommended_max_age_months=7)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_dtp, dose_number=4, recommended_min_age_months=15, recommended_max_age_months=18)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_hep, dose_number=1, recommended_min_age_months=0, recommended_max_age_months=0)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_hep, dose_number=2, recommended_min_age_months=1, recommended_max_age_months=2)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_hep, dose_number=3, recommended_min_age_months=6, recommended_max_age_months=8)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=vaccine_hpv, dose_number=1, recommended_min_age_months=108, recommended_max_age_months=179)

    return schedule


@pytest.mark.django_db
def test_status_sem_dados_e_atraso(base_schedule):
    school = SchoolFactory()
    student = Student.objects.create(
        school=school,
        full_name='Aluno Sem Dados',
        birth_date=timezone.localdate() - datetime.timedelta(days=365 * 2),
    )

    result = build_student_immunization_status(student)
    assert result['status'] == 'SEM_DADOS'
    assert any(item['status'] == 'ATRASADA' for item in result['pending'])


@pytest.mark.django_db
def test_status_em_dia(base_schedule):
    student = StudentFactory(birth_date=timezone.localdate() - datetime.timedelta(days=365))

    for rule in base_schedule.rules.all():
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    result = build_student_immunization_status(student)
    assert result['status'] == 'EM_DIA'
    assert result['pending'] == []


@pytest.mark.django_db
def test_status_incompleto(base_schedule):
    student = StudentFactory(birth_date=timezone.localdate() - datetime.timedelta(days=30 * 16))

    for rule in base_schedule.rules.filter(vaccine__code='DTP').exclude(dose_number=4):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    for rule in base_schedule.rules.filter(vaccine__code='HEPATITE_B'):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    for rule in base_schedule.rules.filter(vaccine__code='TRIPLICE_VIRAL'):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    result = build_student_immunization_status(student)
    assert result['status'] == 'INCOMPLETO'
    assert any(item['vaccineCode'] == 'DTP' and item['doseNumber'] == 4 for item in result['pending'])
    assert any(item['vaccineCode'] == 'HPV' and item['status'] == 'FUTURA' for item in result['future'])


@pytest.mark.django_db
def test_status_em_dia_quando_so_falta_vacina_futura(base_schedule):
    student = StudentFactory(birth_date=timezone.localdate() - datetime.timedelta(days=30 * 24))

    for rule in base_schedule.rules.exclude(vaccine__code='HPV'):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    result = build_student_immunization_status(student)
    assert result['status'] == 'EM_DIA'
    assert result['pending'] == []
    assert any(item['vaccineCode'] == 'HPV' and item['status'] == 'FUTURA' for item in result['future'])


@pytest.mark.django_db
def test_status_atrasado(base_schedule):
    student = StudentFactory(birth_date=timezone.localdate() - datetime.timedelta(days=30 * 21))

    for rule in base_schedule.rules.filter(vaccine__code='DTP').exclude(dose_number=4):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    for rule in base_schedule.rules.filter(vaccine__code='HEPATITE_B'):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    for rule in base_schedule.rules.filter(vaccine__code='TRIPLICE_VIRAL'):
        VaccinationRecordFactory(student=student, vaccine=rule.vaccine, dose_number=rule.dose_number)

    result = build_student_immunization_status(student)
    assert result['status'] == 'ATRASADO'
    assert any(item['status'] == 'ATRASADA' for item in result['pending'])
