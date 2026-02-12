from django.utils import timezone

from core.services import age_in_months_from_birth_date
from immunization.models import VaccineScheduleVersion


def get_active_schedule_version():
    return (
        VaccineScheduleVersion.objects.filter(is_active=True)
        .prefetch_related('rules__vaccine')
        .order_by('-created_at')
        .first()
    )


def build_student_immunization_status(student, schedule_version=None):
    schedule = schedule_version or get_active_schedule_version()
    age_months = age_in_months_from_birth_date(student.birth_date)
    records = list(student.vaccination_records.select_related('vaccine').all())
    records_map = {(record.vaccine_id, record.dose_number): record for record in records}

    pending_items = []
    if schedule:
        for rule in schedule.rules.all():
            if age_months < rule.recommended_min_age_months:
                continue
            key = (rule.vaccine_id, rule.dose_number)
            if key in records_map:
                continue

            pending_status = 'ATRASADA' if age_months > rule.recommended_max_age_months else 'PENDENTE'
            pending_items.append(
                {
                    'vaccineCode': rule.vaccine.code,
                    'vaccineName': rule.vaccine.name,
                    'doseNumber': rule.dose_number,
                    'recommendedMinAgeMonths': rule.recommended_min_age_months,
                    'recommendedMaxAgeMonths': rule.recommended_max_age_months,
                    'status': pending_status,
                }
            )

    if len(records) == 0:
        status = 'SEM_DADOS'
    elif not pending_items:
        status = 'EM_DIA'
    elif any(item['status'] == 'ATRASADA' for item in pending_items):
        status = 'ATRASADO'
    else:
        status = 'INCOMPLETO'

    return {
        'studentId': student.id,
        'studentName': student.full_name,
        'ageMonths': age_months,
        'status': status,
        'asOfDate': timezone.localdate(),
        'activeScheduleCode': schedule.code if schedule else None,
        'pending': pending_items,
    }
