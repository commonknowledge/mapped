# Generated by Django 4.2.11 on 2024-12-19 12:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0150_geocoding_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="area",
            name="mapit_generation_high",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="area",
            name="mapit_generation_low",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
