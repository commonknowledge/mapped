# Generated by Django 4.2.11 on 2024-06-01 08:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0124_hubimage_hubhomepage_favicon_url_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="hubhomepage",
            name="google_analytics_tag_id",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
