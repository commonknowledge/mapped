# Generated by Django 4.2.11 on 2024-12-17 13:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0146_batchrequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="batchrequest",
            name="send_email",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="batchrequest",
            name="sent_email",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="batchrequest",
            name="status",
            field=models.CharField(default="todo", max_length=32),
        ),
    ]