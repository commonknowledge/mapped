# Generated by Django 4.2.11 on 2024-05-26 16:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0113_alter_hubcontentpage_puck_json_content"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mapreport",
            name="display_options",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="mapreport",
            name="layers",
            field=models.JSONField(blank=True, default=list),
        ),
    ]