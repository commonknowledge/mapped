# Generated by Django 4.2.11 on 2024-05-29 13:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0116_alter_externaldatasource_deduplication_hash"),
    ]

    operations = [
        migrations.AddField(
            model_name="externaldatasource",
            name="can_display_details_publicly",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="can_display_points_publicly",
            field=models.BooleanField(default=False),
        ),
    ]
