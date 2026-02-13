from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.token import CustomTokenObtainPairView
from accounts.views import UserViewSet
from analytics_app.views import (
    AgeDistributionDashboardView,
    DashboardAgeBucketsPreferenceView,
    SchoolCoverageDashboardView,
    SchoolRankingDashboardView,
)
from audit.views import AuditLogViewSet, ErrorLogViewSet
from core.views import SchoolViewSet, StudentViewSet
from immunization.views import (
    ExportStudentsPendingCsvView,
    ScheduleRuleDetailView,
    ScheduleRulesView,
    VaccineDoseRuleViewSet,
    VaccineScheduleVersionViewSet,
    VaccineViewSet,
    VaccinationRecordViewSet,
)

router = routers.DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'schools', SchoolViewSet, basename='schools')
router.register(r'students', StudentViewSet, basename='students')
router.register(r'vaccinations', VaccinationRecordViewSet, basename='vaccinations')
router.register(r'vaccines', VaccineViewSet, basename='vaccines')
router.register(r'schedules', VaccineScheduleVersionViewSet, basename='schedules')
router.register(r'schedule-rules', VaccineDoseRuleViewSet, basename='schedule-rules')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'error-logs', ErrorLogViewSet, basename='error-logs')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
    path('api/schedules/<int:schedule_id>/rules/', ScheduleRulesView.as_view(), name='schedule-rules-list'),
    path('api/schedules/<int:schedule_id>/rules/<int:rule_id>/', ScheduleRuleDetailView.as_view(), name='schedule-rules-detail'),
    path('api/dashboards/schools/coverage/', SchoolCoverageDashboardView.as_view(), name='dashboard-school-coverage'),
    path('api/dashboards/schools/ranking/', SchoolRankingDashboardView.as_view(), name='dashboard-school-ranking'),
    path('api/dashboards/age-distribution/', AgeDistributionDashboardView.as_view(), name='dashboard-age-distribution'),
    path('api/dashboards/preferences/age-buckets/', DashboardAgeBucketsPreferenceView.as_view(), name='dashboard-age-buckets-preferences'),
    path('api/exports/students-pending.csv', ExportStudentsPendingCsvView.as_view(), name='export-students-pending'),
]
