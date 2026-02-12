from core.services import age_in_months_from_birth_date
from immunization.services import build_student_immunization_status


AGE_BUCKETS = [
    (0, 11, '0-11'),
    (12, 59, '12-59'),
    (60, 107, '60-107'),
    (108, 999, '108+'),
]


def _bucket_label(age_months):
    for min_age, max_age, label in AGE_BUCKETS:
        if min_age <= age_months <= max_age:
            return label
    return '108+'


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


def build_pending_age_distribution(students):
    distribution = {
        label: {
            'ageBucket': label,
            'pendingCount': 0,
            'overdueCount': 0,
        }
        for _, _, label in AGE_BUCKETS
    }

    for student in students:
        age_months = age_in_months_from_birth_date(student.birth_date)
        status_data = build_student_immunization_status(student)
        for pending in status_data['pending']:
            label = _bucket_label(age_months)
            distribution[label]['pendingCount'] += 1
            if pending['status'] == 'ATRASADA':
                distribution[label]['overdueCount'] += 1

    return list(distribution.values())
