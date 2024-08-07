# Generated by Django 4.2.11 on 2024-08-08 12:19

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0137_remove_2024_from_database"),
    ]

    operations = [
        migrations.AddField(
            model_name="genericdata",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="organisation",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="organisation",
            name="last_update",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
