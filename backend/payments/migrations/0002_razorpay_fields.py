from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="razorpay_order_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                default="",
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="razorpay_payment_id",
            field=models.CharField(
                blank=True,
                max_length=100,
                null=True,
                unique=True,
            ),
        ),
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("razorpay", "Razorpay"),
                    ("card", "Card"),
                    ("upi", "UPI"),
                    ("cod", "Cash on Delivery"),
                ],
                max_length=20,
            ),
        ),
    ]