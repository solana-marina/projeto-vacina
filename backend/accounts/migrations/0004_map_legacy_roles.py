from django.db import migrations


def map_legacy_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role__in=['SCHOOL_OPERATOR', 'SCHOOL_MANAGER']).update(role='ESCOLA')
    User.objects.filter(role__in=['HEALTH_PRO', 'HEALTH_MANAGER']).update(role='SAUDE')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_alter_user_role'),
    ]

    operations = [
        migrations.RunPython(map_legacy_roles, migrations.RunPython.noop),
    ]
