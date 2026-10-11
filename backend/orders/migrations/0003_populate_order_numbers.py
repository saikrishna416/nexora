import uuid
from django.db import migrations


def populate_order_numbers(apps, schema_editor):
    Order = apps.get_model("orders", "Order")

    for order in Order.objects.filter(order_number__isnull=True).iterator():
        order.order_number = f"NXR-{uuid.uuid4().hex[:12].upper()}"
        order.save(update_fields=["order_number"])


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_order_order_number"),
    ]

    operations = [
        migrations.RunPython(
            populate_order_numbers,
            migrations.RunPython.noop,
        ),
    ]