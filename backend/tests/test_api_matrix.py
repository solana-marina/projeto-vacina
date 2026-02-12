import datetime

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


@pytest.fixture
def api_setup():
    school_a = SchoolFactory(name='School A')
    school_b = SchoolFactory(name='School B')

    admin = UserFactory(role=User.RoleChoices.ADMIN, school=None, password='Admin@123')
    school_operator = UserFactory(
        role=User.RoleChoices.SCHOOL_OPERATOR,
        school=school_a,
        password='Escola@123',
    )
    school_manager = UserFactory(
        role=User.RoleChoices.SCHOOL_MANAGER,
        school=school_a,
        password='Escola@123',
    )
    school_b_operator = UserFactory(
        role=User.RoleChoices.SCHOOL_OPERATOR,
        school=school_b,
        password='Escola@123',
    )
    health_pro = UserFactory(role=User.RoleChoices.HEALTH_PRO, school=None, password='Saude@123')
    health_manager = UserFactory(role=User.RoleChoices.HEALTH_MANAGER, school=None, password='Saude@123')

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
        full_name='Student A',
        birth_date=timezone.localdate() - datetime.timedelta(days=365 * 11),
    )
    student_b = StudentFactory(
        school=school_b,
        full_name='Student B',
        birth_date=timezone.localdate() - datetime.timedelta(days=365 * 11),
    )
    record_a = VaccinationRecordFactory(
        student=student_a,
        vaccine=vaccine_hpv,
        dose_number=1,
        created_by=school_operator,
        updated_by=school_operator,
    )

    return {
        'school_a': school_a,
        'school_b': school_b,
        'admin': admin,
        'school_operator': school_operator,
        'school_manager': school_manager,
        'school_b_operator': school_b_operator,
        'health_pro': health_pro,
        'health_manager': health_manager,
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
def test_auth_token_rejects_invalid_password(api_client, api_setup):
    response = api_client.post(
        '/api/auth/token/',
        {'email': api_setup['admin'].email, 'password': 'wrong-pass'},
        format='json',
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_users_endpoints_admin_crud_and_forbidden_for_non_admin(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['school_operator'])
    forbidden = api_client.get('/api/users/')
    assert forbidden.status_code == 403

    api_client.force_authenticate(user=api_setup['admin'])
    list_response = api_client.get('/api/users/')
    assert list_response.status_code == 200

    create_response = api_client.post(
        '/api/users/',
        {
            'email': 'new.user@test.local',
            'password': 'Senha@123',
            'full_name': 'New User',
            'role': User.RoleChoices.HEALTH_PRO,
            'school': None,
            'is_active': True,
        },
        format='json',
    )
    assert create_response.status_code == 201
    created_id = create_response.data['id']

    patch_response = api_client.patch(
        f'/api/users/{created_id}/',
        {'full_name': 'Updated User'},
        format='json',
    )
    assert patch_response.status_code == 200
    assert patch_response.data['full_name'] == 'Updated User'

    delete_response = api_client.delete(f'/api/users/{created_id}/')
    assert delete_response.status_code == 204


@pytest.mark.django_db
def test_schools_endpoints_permissions_and_crud(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['health_pro'])
    list_response = api_client.get('/api/schools/')
    assert list_response.status_code == 200

    create_forbidden = api_client.post('/api/schools/', {'name': 'Forbidden School'}, format='json')
    assert create_forbidden.status_code == 403

    api_client.force_authenticate(user=api_setup['admin'])
    create_response = api_client.post('/api/schools/', {'name': 'Admin School'}, format='json')
    assert create_response.status_code == 201
    school_id = create_response.data['id']

    patch_response = api_client.patch(
        f'/api/schools/{school_id}/',
        {'territory_ref': 'T-01'},
        format='json',
    )
    assert patch_response.status_code == 200
    assert patch_response.data['territory_ref'] == 'T-01'


@pytest.mark.django_db
def test_students_endpoints_crud_and_scoping(api_client, api_setup):
    student_a = api_setup['student_a']
    student_b = api_setup['student_b']

    api_client.force_authenticate(user=api_setup['school_operator'])

    list_response = api_client.get('/api/students/')
    assert list_response.status_code == 200
    returned_ids = {row['id'] for row in list_response.data['results']}
    assert student_a.id in returned_ids
    assert student_b.id not in returned_ids

    own_detail = api_client.get(f'/api/students/{student_a.id}/')
    assert own_detail.status_code == 200

    other_detail = api_client.get(f'/api/students/{student_b.id}/')
    assert other_detail.status_code == 404

    create_own_school = api_client.post(
        '/api/students/',
        {
            'school': api_setup['school_a'].id,
            'full_name': 'Created Student',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365 * 9)),
        },
        format='json',
    )
    assert create_own_school.status_code == 201
    created_id = create_own_school.data['id']

    create_other_school = api_client.post(
        '/api/students/',
        {
            'school': api_setup['school_b'].id,
            'full_name': 'Wrong Scope',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365 * 9)),
        },
        format='json',
    )
    assert create_other_school.status_code == 403

    patch_own = api_client.patch(
        f'/api/students/{created_id}/',
        {'class_group': '6A'},
        format='json',
    )
    assert patch_own.status_code == 200

    patch_other = api_client.patch(
        f'/api/students/{student_b.id}/',
        {'class_group': '7B'},
        format='json',
    )
    assert patch_other.status_code == 404

    delete_response = api_client.delete(f'/api/students/{created_id}/')
    assert delete_response.status_code == 204


@pytest.mark.django_db
def test_student_immunization_status_and_nested_vaccination_endpoints(api_client, api_setup):
    student_a = api_setup['student_a']

    api_client.force_authenticate(user=api_setup['school_manager'])
    status_response = api_client.get(f'/api/students/{student_a.id}/immunization-status/')
    assert status_response.status_code == 200
    assert status_response.data['studentId'] == student_a.id
    assert 'pending' in status_response.data

    list_records_response = api_client.get(f'/api/students/{student_a.id}/vaccinations/')
    assert list_records_response.status_code == 200

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
    assert create_record_response.data['student'] == student_a.id

    api_client.force_authenticate(user=api_setup['school_b_operator'])
    forbidden_response = api_client.post(
        f'/api/students/{student_a.id}/vaccinations/',
        {
            'vaccine': api_setup['vaccine_dtp'].id,
            'dose_number': 2,
            'application_date': str(timezone.localdate()),
            'source': 'INFORMADO_ESCOLA',
        },
        format='json',
    )
    assert forbidden_response.status_code == 404


@pytest.mark.django_db
def test_vaccination_record_viewset_patch_and_delete_permissions(api_client, api_setup):
    record = api_setup['record_a']

    api_client.force_authenticate(user=api_setup['health_pro'])
    list_response = api_client.get('/api/vaccinations/')
    assert list_response.status_code == 200

    patch_response = api_client.patch(
        f'/api/vaccinations/{record.id}/',
        {'notes': 'health edit'},
        format='json',
    )
    assert patch_response.status_code == 200
    assert patch_response.data['notes'] == 'health edit'

    api_client.force_authenticate(user=api_setup['school_b_operator'])
    forbidden_patch = api_client.patch(
        f'/api/vaccinations/{record.id}/',
        {'notes': 'must fail'},
        format='json',
    )
    assert forbidden_patch.status_code == 404

    api_client.force_authenticate(user=api_setup['school_operator'])
    delete_response = api_client.delete(f'/api/vaccinations/{record.id}/')
    assert delete_response.status_code == 204


@pytest.mark.django_db
def test_vaccine_endpoints_permissions_and_crud(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['health_pro'])
    list_response = api_client.get('/api/vaccines/')
    assert list_response.status_code == 200

    forbidden_create = api_client.post('/api/vaccines/', {'code': 'X1', 'name': 'Forbidden'}, format='json')
    assert forbidden_create.status_code == 403

    api_client.force_authenticate(user=api_setup['admin'])
    create_response = api_client.post('/api/vaccines/', {'code': 'TEST_VAC', 'name': 'Test Vac'}, format='json')
    assert create_response.status_code == 201
    vaccine_id = create_response.data['id']

    patch_response = api_client.patch(f'/api/vaccines/{vaccine_id}/', {'name': 'Updated Vac'}, format='json')
    assert patch_response.status_code == 200
    assert patch_response.data['name'] == 'Updated Vac'

    delete_response = api_client.delete(f'/api/vaccines/{vaccine_id}/')
    assert delete_response.status_code == 204


@pytest.mark.django_db
def test_schedule_and_rule_endpoints_permissions_and_crud(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['health_pro'])
    forbidden = api_client.get('/api/schedules/')
    assert forbidden.status_code == 403
    forbidden_rules = api_client.get(f'/api/schedules/{api_setup["schedule"].id}/rules/')
    assert forbidden_rules.status_code == 403

    api_client.force_authenticate(user=api_setup['admin'])
    schedules_response = api_client.get('/api/schedules/')
    assert schedules_response.status_code == 200

    create_schedule = api_client.post(
        '/api/schedules/',
        {'code': 'SCHED_NEW', 'name': 'New Schedule', 'is_active': True},
        format='json',
    )
    assert create_schedule.status_code == 201
    schedule_id = create_schedule.data['id']

    api_setup['schedule'].refresh_from_db()
    assert api_setup['schedule'].is_active is False

    patch_schedule = api_client.patch(
        f'/api/schedules/{schedule_id}/',
        {'name': 'New Schedule Patched'},
        format='json',
    )
    assert patch_schedule.status_code == 200

    create_rule = api_client.post(
        f'/api/schedules/{schedule_id}/rules/',
        {
            'vaccine': api_setup['vaccine_hpv'].id,
            'dose_number': 2,
            'recommended_min_age_months': 120,
            'recommended_max_age_months': 179,
        },
        format='json',
    )
    assert create_rule.status_code == 201
    rule_id = create_rule.data['id']

    list_rules = api_client.get(f'/api/schedules/{schedule_id}/rules/')
    assert list_rules.status_code == 200
    assert any(item['id'] == rule_id for item in list_rules.data)

    retrieve_generic_rule = api_client.get(f'/api/schedule-rules/{rule_id}/')
    assert retrieve_generic_rule.status_code == 200

    patch_rule = api_client.patch(
        f'/api/schedules/{schedule_id}/rules/{rule_id}/',
        {'recommended_max_age_months': 180},
        format='json',
    )
    assert patch_rule.status_code == 200
    assert patch_rule.data['recommended_max_age_months'] == 180

    generic_rules_list = api_client.get('/api/schedule-rules/')
    assert generic_rules_list.status_code == 200

    delete_rule = api_client.delete(f'/api/schedules/{schedule_id}/rules/{rule_id}/')
    assert delete_rule.status_code == 204

    delete_schedule = api_client.delete(f'/api/schedules/{schedule_id}/')
    assert delete_schedule.status_code == 204


@pytest.mark.django_db
def test_dashboard_endpoints_permissions_and_filters(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['school_operator'])
    coverage_forbidden = api_client.get('/api/dashboards/schools/coverage/')
    assert coverage_forbidden.status_code == 403

    api_client.force_authenticate(user=api_setup['school_manager'])
    coverage_allowed = api_client.get('/api/dashboards/schools/coverage/')
    assert coverage_allowed.status_code == 200
    assert 'items' in coverage_allowed.data

    cross_school_forbidden = api_client.get(f'/api/dashboards/schools/coverage/?schoolId={api_setup["school_b"].id}')
    assert cross_school_forbidden.status_code == 403

    ranking_forbidden = api_client.get('/api/dashboards/schools/ranking/')
    assert ranking_forbidden.status_code == 403

    api_client.force_authenticate(user=api_setup['health_manager'])
    ranking_allowed = api_client.get('/api/dashboards/schools/ranking/')
    assert ranking_allowed.status_code == 200
    assert 'items' in ranking_allowed.data

    age_distribution_allowed = api_client.get('/api/dashboards/age-distribution/')
    assert age_distribution_allowed.status_code == 200
    assert 'items' in age_distribution_allowed.data


@pytest.mark.django_db
def test_export_csv_endpoint_for_allowed_roles(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['school_operator'])
    school_response = api_client.get('/api/exports/students-pending.csv')
    assert school_response.status_code == 200
    assert 'text/csv' in school_response['Content-Type']
    assert 'student_id,student_name,school,status' in school_response.content.decode('utf-8')

    api_client.force_authenticate(user=api_setup['health_pro'])
    health_response = api_client.get('/api/exports/students-pending.csv?status=ATRASADO')
    assert health_response.status_code == 200
    assert 'text/csv' in health_response['Content-Type']


@pytest.mark.django_db
def test_critical_operations_create_audit_logs(api_client, api_setup):
    api_client.force_authenticate(user=api_setup['admin'])

    create_student = api_client.post(
        '/api/students/',
        {
            'school': api_setup['school_a'].id,
            'full_name': 'Audit Student',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365 * 10)),
        },
        format='json',
    )
    assert create_student.status_code == 201

    create_schedule = api_client.post(
        '/api/schedules/',
        {'code': 'SCHED_AUDIT', 'name': 'Audit Schedule', 'is_active': False},
        format='json',
    )
    assert create_schedule.status_code == 201

    assert AuditLog.objects.filter(action='student_created', entity_type='Student').exists()
    assert AuditLog.objects.filter(action='schedule_created', entity_type='VaccineScheduleVersion').exists()


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
        ('get', '/api/dashboards/schools/ranking/'),
        ('get', '/api/dashboards/age-distribution/'),
        ('get', '/api/exports/students-pending.csv'),
    ],
)
def test_protected_endpoints_require_authentication(api_client, method, path):
    response = getattr(api_client, method)(path)
    assert response.status_code == 401
