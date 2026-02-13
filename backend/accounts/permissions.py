from accounts.models import User

SCHOOL_ROLES = {User.RoleChoices.ESCOLA}
HEALTH_ROLES = {User.RoleChoices.SAUDE}


def is_admin(user):
    return bool(user and user.is_authenticated and user.role == User.RoleChoices.ADMIN)


def is_school_user(user):
    return bool(user and user.is_authenticated and user.role in SCHOOL_ROLES)


def is_health_user(user):
    return bool(user and user.is_authenticated and user.role in HEALTH_ROLES)


def can_manage_school_data(user):
    return is_admin(user) or is_school_user(user)


def has_dashboard_school_access(user):
    return is_admin(user) or user.role in {User.RoleChoices.ESCOLA, User.RoleChoices.SAUDE}


def has_health_dashboard_access(user):
    return is_admin(user) or user.role == User.RoleChoices.SAUDE


def can_access_school(user, school_id):
    if is_admin(user) or is_health_user(user):
        return True
    return bool(is_school_user(user) and user.school_id == school_id)
