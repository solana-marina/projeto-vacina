import datetime

import factory
from django.utils import timezone

from accounts.models import User
from core.models import School, Student
from immunization.models import Vaccine, VaccineDoseRule, VaccineScheduleVersion, VaccinationRecord


class SchoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = School

    name = factory.Sequence(lambda n: f'Escola {n}')
    inep_code = factory.Sequence(lambda n: f'{10000000 + n}')


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f'user{n}@test.local')
    full_name = factory.Faker('name')
    role = User.RoleChoices.HEALTH_PRO
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        raw_password = extracted or 'Senha@123'
        self.set_password(raw_password)
        if create:
            self.save(update_fields=['password'])


class StudentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Student

    school = factory.SubFactory(SchoolFactory)
    full_name = factory.Faker('name')
    birth_date = factory.LazyFunction(lambda: timezone.localdate() - datetime.timedelta(days=365 * 2))


class VaccineFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Vaccine

    code = factory.Sequence(lambda n: f'VAC{n}')
    name = factory.Sequence(lambda n: f'Vacina {n}')


class VaccineScheduleVersionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VaccineScheduleVersion

    code = factory.Sequence(lambda n: f'SCH{n}')
    name = factory.Sequence(lambda n: f'Calendario {n}')
    is_active = True


class VaccineDoseRuleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VaccineDoseRule

    schedule_version = factory.SubFactory(VaccineScheduleVersionFactory)
    vaccine = factory.SubFactory(VaccineFactory)
    dose_number = 1
    recommended_min_age_months = 0
    recommended_max_age_months = 1


class VaccinationRecordFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = VaccinationRecord

    student = factory.SubFactory(StudentFactory)
    vaccine = factory.SubFactory(VaccineFactory)
    dose_number = 1
    application_date = factory.LazyFunction(timezone.localdate)
    source = VaccinationRecord.SourceChoices.INFORMADO_ESCOLA
