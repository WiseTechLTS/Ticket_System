# Generated by Django 5.1.6 on 2025-03-03 09:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0002_alter_ticket_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='PriorityLevel',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tickets', to='tickets.prioritylevel'),
        ),
    ]
