# Generated by Django 5.2.1 on 2025-06-12 17:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_guidestep'),
    ]

    operations = [
        migrations.AddField(
            model_name='guidestep',
            name='trigger_command',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
