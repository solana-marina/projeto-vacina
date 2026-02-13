import datetime
import importlib

import pytest
from django.utils import timezone

from accounts.models import User
from audit.models import AuditLog
from immunization.models import VaccineDoseRule, VaccineScheduleVersion
from tests.factories import (
    SchoolFactory,
    StudentFactory,
    UserFactory,
    VaccinationRecordFactory,
    VaccineFactory,
)
map_legacy_roles = importlib.import_module('accounts.migrations.0004_map_legacy_roles').map_legacy_roles

@pytest.fixture
def api_setup():
    school_a = SchoolFactory(name='School A')
    school_b = SchoolFactory(name='School B')

    admin = UserFactory(role=User.RoleChoices.ADMIN, school=None, password='Admin@123')
    school_user = UserFactory(role=User.RoleChoices.ESCOLA, school=school_a, password='Escola@123')
    school_b_user = UserFactory(role=User.RoleChoices.ESCOLA, school=school_b, password='Escola@123')
    health_user = UserFactory(role=User.RoleChoices.SAUDE, school=None, password='Saude@123')

    vaccine_hpv = VaccineFactory(code='HPV', name='HPV')
    vaccine_dtp = VaccineFactory(code='DTP', name='DTP')
    schedule = VaccineScheduleVersion.objects.create(
        code='SCHED_BASE',
        name='Base Schedule',
        is_active=True,
        created_by=admin,
        updated_by=admin,
    )
    VaccineDoseRule.objects.create(
        schedule_version=schedule,
        vaccine=vaccine_dtp,
        dose_number=1,
        recommended_min_age_months=2,
        recommended_max_age_months=3,
        created_by=admin,
        updated_by=admin,
    )
    VaccineDoseRule.objects.create(
        schedule_version=schedule,
        vaccine=vaccine_hpv,
        dose_number=1,
        recommended_min_age_months=108,
        recommended_max_age_months=179,
        created_by=admin,
        updated_by=admin,
    )

    student_a = StudentFactory(
        school=school_a,
        full_name='Maria Silva Souza',
        sex='F',
        birth_date=timezone.localdate() - datetime.timedelta(days=365 * 11),
    )
    student_b = StudentFactory(
        school=school_b,
        full_name='Student B',
        sex='M',
        birth_date=timezone.localdate() - datetime.timedelta(days=365 * 11),
    )
    record_a = VaccinationRecordFactory(
        student=student_a,
        vaccine=vaccine_hpv,
        dose_number=1,
        created_by=school_user,
        updated_by=school_user,
    )

    return {
        'school_a': school_a,
        'school_b': school_b,
        'admin': admin,
        'school_user': school_user,
        'school_b_user': school_b_user,
        'health_user': health_user,
        'vaccine_hpv': vaccine_hpv,
        'vaccine_dtp': vaccine_dtp,
        'schedule': schedule,
        'student_a': student_a,
        'student_b': student_b,
        'record_a': record_a,
    }


@pytest.mark.django_db
def test_auth_token_and_refresh_endpoints(api_client, api_setup):
    token_response = api_client.post(
        '/api/auth/token/',
        {'email': api_setup['admin'].email, 'password': 'Admin@123'},
        format='json',
    )

    assert token_response.status_code == 200
    assert 'access' in token_response.data
    assert 'refresh' in token_response.data
    assert token_response.data['role'] == User.RoleChoices.ADMIN

    refresh_response = api_client.post(
        '/api/auth/token/refresh/',
        {'refresh': token_response.data['refresh']},
        format='json',
    )
    assert refresh_response.status_code == 200
    assert 'access' in refresh_response.data


@pytest.mark.django_db
def test_users_admin_crud_and_forbidden_for_non_admin(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['school_user'])
    forbidden = api_client.get('/api/users/')
    assert forbidden.status_code == 403

    api_client.force_authenticate(user=api_setup['admin'])
    create_response = api_client.post(
        '/api/users/',
        {
            'email': 'new.user@test.local',
            'password': 'Senha@123',
            'full_name': 'New User',
            'role': User.RoleChoices.SAUDE,
            'school': None,
            'is_active': True,
        },
        format='json',
    )
    assert create_response.status_code == 201


@pytest.mark.django_db
def test_students_scoping_sex_and_fields(api_client, api_setup):
    student_a = api_setup['student_a']
    student_b = api_setup['student_b']

    api_client.force_authenticate(user=api_setup['school_user'])

    list_response = api_client.get('/api/students/?sex=F')
    assert list_response.status_code == 200
    returned_ids = {row['id'] for row in list_response.data['results']}
    assert student_a.id in returned_ids
    assert student_b.id not in returned_ids
    assert 'sex' in list_response.data['results'][0]
    assert 'class_group' not in list_response.data['results'][0]

    create_without_valid_sex = api_client.post(
        '/api/students/',
        {
            'school': api_setup['school_a'].id,
            'full_name': 'Created Student',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365 * 9)),
            'sex': 'NI',
        },
        format='json',
    )
    assert create_without_valid_sex.status_code == 400

    create_own_school = api_client.post(
        '/api/students/',
        {
            'school': api_setup['school_a'].id,
            'full_name': 'Created Student',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365 * 9)),
            'sex': 'F',
        },
        format='json',
    )
    assert create_own_school.status_code == 201


@pytest.mark.django_db
def test_student_immunization_status_and_nested_vaccination_endpoints(api_client, api_setup):
    student_a = api_setup['student_a']

    api_client.force_authenticate(user=api_setup['school_user'])
    status_response = api_client.get(f'/api/students/{student_a.id}/immunization-status/')
    assert status_response.status_code == 200
    assert status_response.data['studentId'] == student_a.id

    create_record_response = api_client.post(
        f'/api/students/{student_a.id}/vaccinations/',
        {
            'vaccine': api_setup['vaccine_dtp'].id,
            'dose_number': 1,
            'application_date': str(timezone.localdate()),
            'source': 'INFORMADO_ESCOLA',
            'notes': 'added by test',
        },
        format='json',
    )
    assert create_record_response.status_code == 201


@pytest.mark.django_db
def test_dashboard_permissions_and_filters(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['school_user'])
    coverage_allowed = api_client.get('/api/dashboards/schools/coverage/?sex=F')
    assert coverage_allowed.status_code == 200

    ranking_forbidden = api_client.get('/api/dashboards/schools/ranking/')
    assert ranking_forbidden.status_code == 403

    api_client.force_authenticate(user=api_setup['health_user'])
    ranking_allowed = api_client.get('/api/dashboards/schools/ranking/?sex=F')
    assert ranking_allowed.status_code == 200
    assert 'items' in ranking_allowed.data

    age_distribution_allowed = api_client.get('/api/dashboards/age-distribution/?sex=F')
    assert age_distribution_allowed.status_code == 200
    assert 'items' in age_distribution_allowed.data


@pytest.mark.django_db
def test_dashboard_age_bucket_preferences(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['health_user'])

    get_response = api_client.get('/api/dashboards/preferences/age-buckets/')
    assert get_response.status_code == 200
    assert isinstance(get_response.data['ageBuckets'], list)

    put_response = api_client.put(
        '/api/dashboards/preferences/age-buckets/',
        {
            'ageBuckets': [
                {'label': '0-23', 'minMonths': 0, 'maxMonths': 23},
                {'label': '24+', 'minMonths': 24, 'maxMonths': 999},
            ]
        },
        format='json',
    )
    assert put_response.status_code == 200
    assert put_response.data['ageBuckets'][0]['label'] == '0-23'


@pytest.mark.django_db
def test_export_csv_semicolon_and_anonymized(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['health_user'])

    response = api_client.get('/api/exports/students-pending.csv?sex=F')
    assert response.status_code == 200
    content = response.content.decode('utf-8')
    assert 'student_id;student_name;school;status' in content

    anonymized = api_client.get('/api/exports/students-pending.csv?sex=F&anonymized=true')
    assert anonymized.status_code == 200
    anonymized_content = anonymized.content.decode('utf-8')
    assert 'M.S.S' in anonymized_content


@pytest.mark.django_db
def test_duplicate_rule_returns_friendly_error(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['admin'])

    response = api_client.post(
        f"/api/schedules/{api_setup['schedule'].id}/rules/",
        {
            'vaccine': api_setup['vaccine_hpv'].id,
            'dose_number': 1,
            'recommended_min_age_months': 108,
            'recommended_max_age_months': 179,
        },
        format='json',
    )

    assert response.status_code == 400
    assert 'Ja existe regra para vacina HPV' in str(response.data)


@pytest.mark.django_db
def test_audit_and_error_logs_admin_only(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['school_user'])
    forbidden_audit = api_client.get('/api/audit-logs/')
    forbidden_error = api_client.get('/api/error-logs/')
    assert forbidden_audit.status_code == 403
    assert forbidden_error.status_code == 403

    api_client.force_authenticate(user=api_setup['admin'])
    create_student = api_client.post(
        '/api/students/',
        {
            'school': api_setup['school_a'].id,
            'full_name': 'Audit Student',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365 * 10)),
            'sex': 'F',
        },
        format='json',
    )
    assert create_student.status_code == 201

    assert AuditLog.objects.filter(action='student_created', entity_type='Student').exists()

    error_trigger = api_client.get('/api/students/not-a-number/')
    assert error_trigger.status_code in {404, 400}

    logs_response = api_client.get('/api/error-logs/')
    assert logs_response.status_code == 200
    assert logs_response.data['count'] >= 1


@pytest.mark.django_db
def test_role_data_migration_maps_legacy_values():
    school = SchoolFactory()
    legacy_school = User.objects.create_user(
        email='legacy.school@test.local',
        password='Senha@123',
        full_name='Legacy School',
        role='SCHOOL_OPERATOR',
        school=school,
    )
    legacy_health = User.objects.create_user(
        email='legacy.health@test.local',
        password='Senha@123',
        full_name='Legacy Health',
        role='HEALTH_MANAGER',
    )

    class _Apps:
        @staticmethod
        def get_model(_app_label, _model_name):
            return User

    map_legacy_roles(_Apps(), None)

    legacy_school.refresh_from_db()
    legacy_health.refresh_from_db()

    assert legacy_school.role == User.RoleChoices.ESCOLA
    assert legacy_health.role == User.RoleChoices.SAUDE


@pytest.mark.django_db
@pytest.mark.parametrize(
    'method,path',
    [
        ('get', '/api/users/'),
        ('get', '/api/schools/'),
        ('get', '/api/students/'),
        ('get', '/api/vaccinations/'),
        ('get', '/api/vaccines/'),
        ('get', '/api/schedules/'),
        ('get', '/api/dashboards/schools/coverage/'),
        ('get', '/api/exports/students-pending.csv'),
    ],
)
def test_protected_endpoints_require_authentication(api_client, method, path):
    response = getattr(api_client, method)(path)
    assert response.status_code == 401

