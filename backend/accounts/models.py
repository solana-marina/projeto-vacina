from django.contrib.auth.models import AbstractUser
from django.db import models

from accounts.managers import UserManager


class User(AbstractUser):
    class RoleChoices(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        SCHOOL_OPERATOR = 'SCHOOL_OPERATOR', 'Operador Escolar'
        SCHOOL_MANAGER = 'SCHOOL_MANAGER', 'Gestor Escolar'
        HEALTH_PRO = 'HEALTH_PRO', 'Profissional de Saude'
        HEALTH_MANAGER = 'HEALTH_MANAGER', 'Gestor de Saude'

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=RoleChoices.choices)
    school = models.ForeignKey('core.School', null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    def __str__(self):
        return f'{self.full_name} ({self.email})'
