# Generated by Django 4.2.10 on 2024-03-11 09:56

from django.db import migrations, models
import django.db.models.deletion
import django_jsonform.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0079_alter_externaldatasource_geography_column_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataset",
            name="external_data_source",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="hub.externaldatasource",
            ),
        ),
        migrations.AlterField(
            model_name="externaldatasource",
            name="fields",
            field=django_jsonform.models.fields.JSONField(
                blank=True, default=list, null=True
            ),
        ),
        migrations.AlterField(
            model_name="externaldatasource",
            name="update_mapping",
            field=django_jsonform.models.fields.JSONField(
                blank=True, default=list, null=True
            ),
        ),
    ]
