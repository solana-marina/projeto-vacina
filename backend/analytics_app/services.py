from __future__ import annotations

from typing import Iterable

from analytics_app.models import DEFAULT_AGE_BUCKETS, DashboardPreference
from core.services import age_in_months_from_birth_date
from immunization.services import build_student_immunization_status


def normalize_age_buckets(raw_buckets: list[dict] | None):
    if not raw_buckets:
        return DEFAULT_AGE_BUCKETS

    normalized = []
    for item in raw_buckets:
        label = item.get('label')
        min_months = item.get('minMonths')
        max_months = item.get('maxMonths')

        if not isinstance(label, str):
            continue
        if not isinstance(min_months, int) or not isinstance(max_months, int):
            continue
        if min_months < 0 or max_months < min_months:
            continue

        normalized.append({'label': label, 'minMonths': min_months, 'maxMonths': max_months})

    if not normalized:
        return DEFAULT_AGE_BUCKETS

    normalized.sort(key=lambda bucket: bucket['minMonths'])
    return normalized


def get_user_age_buckets(user):
    preference, _ = DashboardPreference.objects.get_or_create(
        user=user,
        defaults={'age_buckets_json': DEFAULT_AGE_BUCKETS},
    )
    buckets = normalize_age_buckets(preference.age_buckets_json)
    if buckets != preference.age_buckets_json:
        preference.age_buckets_json = buckets
        preference.save(update_fields=['age_buckets_json', 'updated_at'])
    return buckets


def _bucket_label(age_months: int, age_buckets: list[dict]):
    for bucket in age_buckets:
        if bucket['minMonths'] <= age_months <= bucket['maxMonths']:
            return bucket['label']
    return age_buckets[-1]['label']


def build_coverage_by_school(students):
    by_school = {}
    for student in students:
        status_data = build_student_immunization_status(student)
        school_name = student.school.name
        if school_name not in by_school:
            by_school[school_name] = {
                'schoolId': student.school_id,
                'schoolName': school_name,
                'totalStudents': 0,
                'EM_DIA': 0,
                'ATRASADO': 0,
                'INCOMPLETO': 0,
                'SEM_DADOS': 0,
            }

        school_entry = by_school[school_name]
        school_entry['totalStudents'] += 1
        school_entry[status_data['status']] += 1

    for item in by_school.values():
        total = item['totalStudents'] or 1
        item['coveragePercent'] = round((item['EM_DIA'] / total) * 100, 2)

    return list(by_school.values())


def build_ranking(students):
    coverage = build_coverage_by_school(students)
    for item in coverage:
        total = item['totalStudents'] or 1
        item['delayPercent'] = round((item['ATRASADO'] / total) * 100, 2)
        item['noDataPercent'] = round((item['SEM_DADOS'] / total) * 100, 2)

    return sorted(coverage, key=lambda x: (x['delayPercent'], x['noDataPercent']), reverse=True)


def build_pending_age_distribution(students, age_buckets=None):
    buckets = normalize_age_buckets(age_buckets)
    distribution = {
        bucket['label']: {
            'ageBucket': bucket['label'],
            'pendingCount': 0,
            'overdueCount': 0,
        }
        for bucket in buckets
    }

    for student in students:
        age_months = age_in_months_from_birth_date(student.birth_date)
        status_data = build_student_immunization_status(student)
        for pending in status_data['pending']:
            label = _bucket_label(age_months, buckets)
            distribution[label]['pendingCount'] += 1
            if pending['status'] == 'ATRASADA':
                distribution[label]['overdueCount'] += 1

    return list(distribution.values())


def filter_students_for_dashboard(students: Iterable, *, q=None, school_id=None, status=None, age_min=None, age_max=None, sex=None):
    age_min_value = None
    age_max_value = None
    if age_min not in (None, ''):
        age_min_value = int(age_min)
    if age_max not in (None, ''):
        age_max_value = int(age_max)

    filtered = []
    for student in students:
        if q and q.lower() not in student.full_name.lower():
            continue
        if school_id and str(student.school_id) != str(school_id):
            continue
        if sex and student.sex != sex:
            continue

        age_months = age_in_months_from_birth_date(student.birth_date)
        if age_min_value is not None and age_months < age_min_value:
            continue
        if age_max_value is not None and age_months > age_max_value:
            continue

        status_data = build_student_immunization_status(student)
        if status and status_data['status'] != status:
            continue

        filtered.append(student)

    return filtered
