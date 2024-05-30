# Generated by Django 4.2.11 on 2024-05-27 14:49

import hashlib
from django.db import migrations, models
from django.db.migrations.state import ProjectState
import hub.fields


def generate_deduplication_hash(apps, schema_editor):
    """
    Populate deduplication_hash by calling save() on all
    external data sources.

    Have to duplicate code that generates deduplication_hash in
    ExternalDataSource.save() because migrations don't
    create instances of specific model classes, but
    generic objects.

    """
    AirtableSource = apps.get_model("hub", "AirtableSource")
    ActionNetworkSource = apps.get_model("hub", "ActionNetworkSource")
    MailchimpSource = apps.get_model("hub", "MailchimpSource")

    sources = AirtableSource.objects.all()
    for source in sources:
        hash_values = [source.base_id, source.table_id, source.api_key]
        source.deduplication_hash = hashlib.md5(
            "".join(hash_values).encode()
        ).hexdigest()
        source.save()

    sources = ActionNetworkSource.objects.all()
    for source in sources:
        hash_values = [source.api_key]
        source.deduplication_hash = hashlib.md5(
            "".join(hash_values).encode()
        ).hexdigest()
        source.save()

    sources = MailchimpSource.objects.all()
    for source in sources:
        hash_values = [source.list_id, source.api_key]
        source.deduplication_hash = hashlib.md5(
            "".join(hash_values).encode()
        ).hexdigest()
        source.save()


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0113_alter_mapreport_display_options_and_more"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="airtablesource",
            unique_together=set(),
        ),
        # This seems to be unnecessary
        # migrations.AlterUniqueTogether(
        #     name="mailchimpsource",
        #     unique_together=set(),
        # ),
        migrations.AddField(
            model_name="externaldatasource",
            name="deduplication_hash",
            field=models.CharField(default="", editable=False, max_length=32),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="actionnetworksource",
            name="api_key",
            field=hub.fields.EncryptedCharField(max_length=250),
        ),
        migrations.RunPython(
            generate_deduplication_hash, reverse_code=migrations.RunPython.noop
        ),
        migrations.AlterField(
            model_name="externaldatasource",
            name="deduplication_hash",
            field=models.CharField(
                default="", editable=False, max_length=32, unique=True
            ),
        ),
    ]

    def apply(self, project_state: ProjectState, *args, **kwargs) -> ProjectState:
        """
        The AlterUniqueTogether migration above fails if no unique constraint exists.
        This try/except allows the migration to succeed in this case.
        """
        try:
            return super().apply(project_state, *args, **kwargs)
        except Exception as e:
            if (
                str(e)
                == "Found wrong number (0) of constraints for hub_airtablesource(base_id, table_id, api_key)"
            ):
                return project_state
            raise e