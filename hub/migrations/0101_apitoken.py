# Generated by Django 4.2.10 on 2024-04-18 08:22

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_cryptography.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hub", "0100_merge_20240408_1328"),
    ]

    operations = [
        migrations.CreateModel(
            name="APIToken",
            fields=[
                (
                    "token",
                    django_cryptography.fields.encrypt(
                        models.CharField(max_length=1500)
                    ),
                ),
                ("expires_at", models.DateTimeField()),
                (
                    "signature",
                    models.CharField(
                        editable=False,
                        max_length=1500,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("revoked", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_update", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="tokens",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
