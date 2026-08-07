from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from audit.services import create_audit_log


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['school_id'] = user.school_id
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['school_id'] = self.user.school_id
        data['full_name'] = self.user.full_name
        data['email'] = self.user.email
        data['user_id'] = self.user.id
        self._log_successful_login()
        return data

    def _log_successful_login(self):
        request = self.context.get('request')
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '') if request else ''
        ip = (
            forwarded_for.split(',')[0].strip()
            if forwarded_for
            else (request.META.get('REMOTE_ADDR') if request else '')
        )
        details = {
            'email': self.user.email,
            'role': self.user.role,
            'school_id': self.user.school_id,
            'path': request.path if request else '',
            'ip': ip or '',
            'user_agent': (request.META.get('HTTP_USER_AGENT', '') if request else '')[:255],
        }
        create_audit_log(self.user, 'user_login', 'User', self.user.id, details)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
