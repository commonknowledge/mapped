# Generated by Django 4.2.11 on 2024-06-03 11:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0125_hubhomepage_google_analytics_tag_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="actionnetworksource",
            name="group_slug",
            field=models.CharField(default="", max_length=100),
            preserve_default=False,
        ),
    ]
