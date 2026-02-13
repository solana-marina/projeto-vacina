from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from accounts.models import User
from core.models import School, Student
from immunization.models import Vaccine, VaccineDoseRule, VaccineScheduleVersion, VaccinationRecord
from immunization.services import build_student_immunization_status


class Command(BaseCommand):
    help = 'Popula ambiente de demonstracao com usuarios, escolas, estudantes e calendario vacinal.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Limpa dados de estudantes e imunizacao antes de semear.')

    @transaction.atomic
    def handle(self, *args, **options):
        faker = Faker('pt_BR')

        if options['reset']:
            VaccinationRecord.objects.all().delete()
            Student.objects.all().delete()
            VaccineDoseRule.objects.all().delete()
            VaccineScheduleVersion.objects.all().delete()
            Vaccine.objects.all().delete()

        school_a, _ = School.objects.get_or_create(name='Escola Municipal Aurora', defaults={'inep_code': '12345678'})
        school_b, _ = School.objects.get_or_create(name='Escola Estadual Horizonte', defaults={'inep_code': '87654321'})

        admin_user = self._upsert_user(
            email='admin@vacina.local',
            full_name='Admin Sistema',
            role=User.RoleChoices.ADMIN,
            password='Admin@123',
            school=None,
            is_staff=True,
            is_superuser=True,
        )
        self._upsert_user(
            email='operador.escola@vacina.local',
            full_name='Operador Escola A',
            role=User.RoleChoices.ESCOLA,
            password='Escola@123',
            school=school_a,
        )
        self._upsert_user(
            email='gestor.escola@vacina.local',
            full_name='Gestor Escola A',
            role=User.RoleChoices.ESCOLA,
            password='Escola@123',
            school=school_a,
        )
        self._upsert_user(
            email='saude@vacina.local',
            full_name='Profissional Saude',
            role=User.RoleChoices.SAUDE,
            password='Saude@123',
            school=None,
        )
        self._upsert_user(
            email='gestor.saude@vacina.local',
            full_name='Gestor Saude',
            role=User.RoleChoices.SAUDE,
            password='Saude@123',
            school=None,
        )

        vaccines = self._seed_vaccines()
        schedule = VaccineScheduleVersion.objects.create(
            code='PNI-2025-V1',
            name='Calendario Nacional 2025 - Prototipo',
            is_active=True,
            created_by=admin_user,
            updated_by=admin_user,
        )
        self._seed_rules(schedule, vaccines, admin_user)

        schools = [school_a, school_b]
        students = []
        today = date.today()
        for idx in range(20):
            school = schools[idx % len(schools)]
            age_months = 8 + (idx * 8)
            birth_date = today - timedelta(days=age_months * 30)
            student = Student.objects.create(
                school=school,
                full_name=faker.name(),
                birth_date=birth_date,
                sex=Student.SexChoices.FEMALE if idx % 2 == 0 else Student.SexChoices.MALE,
                guardian_name=faker.name(),
                guardian_contact=faker.phone_number()[:50],
                created_by=admin_user,
                updated_by=admin_user,
            )
            students.append(student)

        for idx, student in enumerate(students):
            profile = idx % 4
            self._seed_student_records(student, schedule, admin_user, profile)

        status_totals = {'EM_DIA': 0, 'ATRASADO': 0, 'INCOMPLETO': 0, 'SEM_DADOS': 0}
        for student in students:
            status = build_student_immunization_status(student)['status']
            status_totals[status] += 1

        self.stdout.write(self.style.SUCCESS('Seed concluido com sucesso.'))
        self.stdout.write('Usuarios demo:')
        self.stdout.write('  admin@vacina.local / Admin@123')
        self.stdout.write('  operador.escola@vacina.local / Escola@123')
        self.stdout.write('  saude@vacina.local / Saude@123')
        self.stdout.write(f'Status distribuidos: {status_totals}')

    def _upsert_user(self, email, full_name, role, password, school=None, is_staff=False, is_superuser=False):
        user, _ = User.objects.get_or_create(email=email)
        user.full_name = full_name
        user.role = role
        user.school = school
        user.is_active = True
        user.is_staff = is_staff or role == User.RoleChoices.ADMIN
        user.is_superuser = is_superuser
        user.set_password(password)
        user.save()
        return user

    def _seed_vaccines(self):
        data = [
            ('TRIPLICE_VIRAL', 'Triplice Viral'),
            ('DTP', 'DTP'),
            ('HEPATITE_B', 'Hepatite B'),
            ('HPV', 'HPV'),
        ]
        vaccines = {}
        for code, name in data:
            vaccine, _ = Vaccine.objects.get_or_create(code=code, defaults={'name': name})
            vaccine.name = name
            vaccine.save()
            vaccines[code] = vaccine
        return vaccines

    def _seed_rules(self, schedule, vaccines, actor):
        rules = [
            ('TRIPLICE_VIRAL', 1, 12, 15),
            ('DTP', 1, 2, 3),
            ('DTP', 2, 4, 5),
            ('DTP', 3, 6, 7),
            ('DTP', 4, 15, 18),
            ('HEPATITE_B', 1, 0, 0),
            ('HEPATITE_B', 2, 1, 2),
            ('HEPATITE_B', 3, 6, 8),
            ('HPV', 1, 108, 179),
        ]
        for vaccine_code, dose, min_age, max_age in rules:
            VaccineDoseRule.objects.create(
                schedule_version=schedule,
                vaccine=vaccines[vaccine_code],
                dose_number=dose,
                recommended_min_age_months=min_age,
                recommended_max_age_months=max_age,
                created_by=actor,
                updated_by=actor,
            )

    def _seed_student_records(self, student, schedule, actor, profile):
        age_months = ((date.today().year - student.birth_date.year) * 12) + (date.today().month - student.birth_date.month)
        due_rules = [rule for rule in schedule.rules.all() if age_months >= rule.recommended_min_age_months]

        if profile == 0:
            return

        if profile == 1:
            take = max(1, len(due_rules) // 3)
            selected_rules = due_rules[:take]
        elif profile == 2:
            selected_rules = due_rules
        else:
            selected_rules = due_rules[:-1] if len(due_rules) > 1 else due_rules

        for rule in selected_rules:
            VaccinationRecord.objects.get_or_create(
                student=student,
                vaccine=rule.vaccine,
                dose_number=rule.dose_number,
                defaults={
                    'application_date': date.today() - timedelta(days=20),
                    'source': VaccinationRecord.SourceChoices.INFORMADO_ESCOLA,
                    'notes': 'Registro de demonstracao',
                    'created_by': actor,
                    'updated_by': actor,
                },
            )
