import datetime

import pytest
from django.utils import timezone

from accounts.models import User
from immunization.models import Vaccine
from tests.factories import (
    SchoolFactory,
    StudentFactory,
    UserFactory,
    VaccinationRecordFactory,
    VaccineDoseRuleFactory,
    VaccineFactory,
    VaccineScheduleVersionFactory,
)


@pytest.fixture
def schedule_data():
    schedule = VaccineScheduleVersionFactory(is_active=True)
    triplice = VaccineFactory(code='TRIPLICE_VIRAL', name='Triplice Viral')
    dtp = VaccineFactory(code='DTP', name='DTP')

    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=triplice, dose_number=1, recommended_min_age_months=12, recommended_max_age_months=15)
    VaccineDoseRuleFactory(schedule_version=schedule, vaccine=dtp, dose_number=1, recommended_min_age_months=2, recommended_max_age_months=3)
    return schedule


@pytest.mark.django_db
def test_immunization_status_endpoint(api_client, schedule_data):
    school = SchoolFactory()
    user = UserFactory(role=User.RoleChoices.SCHOOL_MANAGER, school=school)
    student = StudentFactory(school=school, birth_date=timezone.localdate() - datetime.timedelta(days=30 * 14))

    api_client.force_authenticate(user=user)
    response = api_client.get(f'/api/students/{student.id}/immunization-status/')

    assert response.status_code == 200
    assert response.data['studentId'] == student.id
    assert 'status' in response.data
    assert 'pending' in response.data


@pytest.mark.django_db
def test_dashboard_permissions(api_client, schedule_data):
    school = SchoolFactory()
    school_operator = UserFactory(role=User.RoleChoices.SCHOOL_OPERATOR, school=school)
    health_pro = UserFactory(role=User.RoleChoices.HEALTH_PRO, school=None)

    api_client.force_authenticate(user=school_operator)
    forbidden_response = api_client.get('/api/dashboards/schools/ranking/')
    assert forbidden_response.status_code == 403

    api_client.force_authenticate(user=health_pro)
    allowed_response = api_client.get('/api/dashboards/schools/ranking/')
    assert allowed_response.status_code == 200
    assert 'items' in allowed_response.data


@pytest.mark.django_db
def test_coverage_dashboard_returns_aggregated_data(api_client, schedule_data):
    school = SchoolFactory(name='Escola Cobertura')
    user = UserFactory(role=User.RoleChoices.HEALTH_MANAGER, school=None)

    student = StudentFactory(school=school, birth_date=timezone.localdate() - datetime.timedelta(days=30 * 15))
    dtp = Vaccine.objects.get(code='DTP')
    VaccinationRecordFactory(student=student, vaccine=dtp, dose_number=1)

    api_client.force_authenticate(user=user)
    response = api_client.get('/api/dashboards/schools/coverage/')

    assert response.status_code == 200
    assert len(response.data['items']) >= 1
    assert any(item['schoolName'] == 'Escola Cobertura' for item in response.data['items'])
