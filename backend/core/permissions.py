from rest_framework import permissions

from accounts.models import User
from accounts.permissions import is_admin, is_health_user, is_school_user


class SchoolPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return is_admin(user) or is_health_user(user) or is_school_user(user)
        return is_admin(user)


class StudentPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role in {
            User.RoleChoices.ADMIN,
            User.RoleChoices.SCHOOL_OPERATOR,
            User.RoleChoices.SCHOOL_MANAGER,
            User.RoleChoices.HEALTH_PRO,
            User.RoleChoices.HEALTH_MANAGER,
        }:
            return True
        return False
