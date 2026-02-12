from rest_framework import permissions, viewsets

from accounts.models import User
from accounts.serializers import UserSerializer


class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.RoleChoices.ADMIN)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('school').all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]
