import datetime

import pytest
from django.urls import reverse
from django.utils import timezone

from accounts.models import User
from tests.factories import SchoolFactory, StudentFactory, UserFactory, VaccineFactory


@pytest.mark.django_db
def test_school_user_cannot_access_other_school_student(api_client):
    school_a = SchoolFactory(name='Escola A')
    school_b = SchoolFactory(name='Escola B')

    user_school = UserFactory(role=User.RoleChoices.ESCOLA, school=school_a)
    student_b = StudentFactory(school=school_b)

    api_client.force_authenticate(user=user_school)
    response = api_client.get(f'/api/students/{student_b.id}/')

    assert response.status_code == 404


@pytest.mark.django_db
def test_school_user_cannot_create_student_in_other_school(api_client):
    school_a = SchoolFactory(name='Escola A')
    school_b = SchoolFactory(name='Escola B')

    user_school = UserFactory(role=User.RoleChoices.ESCOLA, school=school_a)

    api_client.force_authenticate(user=user_school)
    response = api_client.post(
        '/api/students/',
        {
            'school': school_b.id,
            'full_name': 'Aluno Invalido',
            'birth_date': str(timezone.localdate() - datetime.timedelta(days=365)),
            'sex': 'F',
        },
        format='json',
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_health_user_can_access_any_school_student(api_client):
    school_b = SchoolFactory(name='Escola B')
    user_health = UserFactory(role=User.RoleChoices.SAUDE, school=None)
    student_b = StudentFactory(school=school_b)

    api_client.force_authenticate(user=user_health)
    response = api_client.get(f'/api/students/{student_b.id}/')

    assert response.status_code == 200
    assert response.data['id'] == student_b.id
