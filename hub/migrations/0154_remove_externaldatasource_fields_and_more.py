# Generated by Django 4.2.11 on 2025-01-30 21:06

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0153_uploadedcsvsource_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="externaldatasource",
            name="fields",
        ),
        migrations.AlterField(
            model_name="genericdata",
            name="geocode_data",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="report",
            name="slug",
            field=models.SlugField(default=uuid.uuid4, max_length=250, unique=True),
        ),
    ]
