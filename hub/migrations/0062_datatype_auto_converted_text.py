# Generated by Django 4.2.5 on 2024-01-16 11:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0061_alter_dataset_data_type_alter_datatype_data_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="datatype",
            name="auto_converted_text",
            field=models.TextField(blank=True, null=True),
        ),
    ]