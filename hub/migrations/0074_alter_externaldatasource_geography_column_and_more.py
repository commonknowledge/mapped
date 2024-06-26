# Generated by Django 4.2.10 on 2024-03-10 00:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0073_remove_externaldatasourceupdateconfig_postcode_column_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="externaldatasource",
            name="geography_column",
            field=models.CharField(default="postcode", max_length=250),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="externaldatasource",
            name="geography_column_type",
            field=models.CharField(
                choices=[
                    ("postcode", "Postcode"),
                    ("ward", "Ward"),
                    ("council", "Council"),
                    ("constituency", "Constituency"),
                ],
                default="postcode",
                max_length=250,
            ),
        ),
    ]
