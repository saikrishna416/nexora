from django.db import models

from orders.models import Order


class Payment(models.Model):

    PAYMENT_METHOD_CHOICES = [
        ("card", "Card"),
        ("upi", "UPI"),
        ("cod", "Cash on Delivery"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    order = models.OneToOneField(
        Order,
        on_delete=models.PROTECT,
        related_name="payment"
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )

    transaction_id = models.CharField(
        max_length=100,
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id}"