# Generated by Django 4.2.17 on 2025-01-08 23:29

from django.db import migrations, models
import django.db.models.deletion
import django_jsonform.models.fields


def backfill_areas_to_generic_data(apps, schema_editor):
    # Areas that have been geocoded by the geocoder will have a geocode_data field with data like
    # {
    #   "data": {
    #     "area_fields": {
    #       "STC": "E06000014",
    #       "WD23": "E05010327"
    #     }
    #   }
    # }
    # The last key in the area_fields dict is the area type, and the value is the area code.
    # We can use this to find the area and set it on the generic data.
    GenericData = apps.get_model("hub", "GenericData")
    Area = apps.get_model("hub", "Area")
    for generic_data in GenericData.objects.filter(
        area=None,
        geocode_data__data__area_fields__isnull=False,
        # i.e. it has been geocoded successfully
        postcode_data__isnull=False,
    ):
        area_fields: dict = generic_data.geocode_data.get("data", {}).get(
            "area_fields", {}
        )
        if len(area_fields.keys()) > 0:
            area_type, gss = area_fields.popitem()
            area = Area.objects.filter(gss=gss).first()
            if area:
                generic_data.area = area
                generic_data.save()


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0151_area_mapit_generation_high_area_mapit_generation_low"),
    ]

    operations = [
        migrations.AddField(
            model_name="genericdata",
            name="area",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="generic_data",
                to="hub.area",
            ),
        ),
        migrations.AlterField(
            model_name="externaldatasource",
            name="geocoding_config",
            field=django_jsonform.models.fields.JSONField(default=dict),
        ),
        migrations.AlterField(
            model_name="genericdata",
            name="geocoder",
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
        migrations.RunPython(code=backfill_areas_to_generic_data),
    ]
