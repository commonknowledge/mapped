# Generated by Django 4.2.10 on 2024-03-27 11:07

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0093_sharingpermission_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="externaldatasource",
            old_name="sharing_permissions",
            new_name="orgs_with_access",
        ),
    ]
