# Generated by Django 4.2.10 on 2024-02-08 17:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0062_datatype_auto_converted_text"),
    ]

    operations = [
        migrations.AlterField(
            model_name="areadata",
            name="data",
            field=models.CharField(max_length=400),
        ),
        migrations.AlterField(
            model_name="persondata",
            name="data",
            field=models.CharField(max_length=400),
        ),
    ]