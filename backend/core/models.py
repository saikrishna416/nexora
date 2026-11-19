import re

from django.db import models
from django.utils import timezone


_CONTACT_CATEGORY_PATTERN = re.compile(r"^\[\[NEXORA_CATEGORY:([^\]]{1,60})\]\]\s*(.*)$")


def encode_contact_subject(category, subject):
    return f"[[NEXORA_CATEGORY:{category}]] {subject}"


def decode_contact_subject(value):
    match = _CONTACT_CATEGORY_PATTERN.match(value or "")
    if match:
        return match.group(1), match.group(2)
    return "General", value or ""


class ContactInquiry(models.Model):
    STATUS_CHOICES = [
        ("new", "Open"),
        ("in_progress", "In Progress"),
        ("agent_assigned", "Agent Assigned"),
        ("resolved", "Resolved"),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, default="")
    order_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Optional customer-provided Order ID (e.g. NXR-XXXXXXXXX).",
    )
    subject = models.CharField(max_length=200)
    message = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new",
        db_index=True,
    )
    internal_notes = models.TextField(
        blank=True,
        default="",
        help_text="Internal staff notes regarding triage, follow-up, and resolution.",
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        editable=False,
    )
    user_agent = models.TextField(
        blank=True,
        default="",
        editable=False,
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Contact Inquiry"
        verbose_name_plural = "Contact Inquiries"

    def __str__(self):
        return f"[{self.get_status_display()}] {self.name} - {self.subject}"

    @property
    def public_ticket_id(self):
        created_at = timezone.localtime(self.created_at)
        suffix = str(100000 + self.pk)[-6:].zfill(6)
        return f"NX-{created_at:%Y%m%d}-{suffix}"

    @property
    def category(self):
        return decode_contact_subject(self.subject)[0]

    @property
    def customer_subject(self):
        return decode_contact_subject(self.subject)[1]


class BusinessPolicyConfig(models.Model):
    """
    Singleton model (pk=1) storing configurable business details
    and policy approval states.
    All business details are nullable/blank by default.
    """
    POLICY_STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("APPROVED", "Approved"),
    ]

    RETURN_WINDOW_CHOICES = [
        (7, "7 Days"),
        (10, "10 Days"),
    ]

    # 1. Return Window (7 or 10 days)
    return_window_days = models.PositiveIntegerField(
        choices=RETURN_WINDOW_CHOICES,
        null=True,
        blank=True,
        help_text="Eligible return window in days (7 or 10 days).",
    )

    # 2. Refund Business Days
    refund_business_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Refund settlement timeframe in business days (e.g., 5 or 7).",
    )

    # 3. Free vs Paid Shipping Toggle + Fee Amount & Threshold
    free_shipping_enabled = models.BooleanField(
        default=False,
        help_text="Enable free shipping storewide or above a specified order threshold.",
    )
    free_shipping_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum cart subtotal (in INR) required for free shipping.",
    )
    standard_shipping_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Standard shipping fee (in INR) charged when free shipping does not apply.",
    )

    # 4. Order Processing & Delivery Estimates
    order_processing_time = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Standard handling/fulfillment estimate (e.g., '1-2 business days').",
    )
    delivery_estimate_time = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Standard transit delivery estimate (e.g., '3-5 business days').",
    )

    # 5. Support Email
    support_email = models.EmailField(
        blank=True,
        default="",
        help_text="Official customer support email address.",
    )

    # 6. Support Phone
    support_phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="Official customer support telephone/mobile number.",
    )

    # 7. Business Address
    business_address = models.TextField(
        blank=True,
        default="",
        help_text="Physical operating/registered business address.",
    )

    # Individual DRAFT vs APPROVED status toggles for each policy
    privacy_policy_status = models.CharField(
        max_length=10,
        choices=POLICY_STATUS_CHOICES,
        default="DRAFT",
        help_text="Approval state for the Privacy Policy.",
    )
    terms_conditions_status = models.CharField(
        max_length=10,
        choices=POLICY_STATUS_CHOICES,
        default="DRAFT",
        help_text="Approval state for Terms & Conditions.",
    )
    return_refund_status = models.CharField(
        max_length=10,
        choices=POLICY_STATUS_CHOICES,
        default="DRAFT",
        help_text="Approval state for Return, Refund & Cancellation Policy.",
    )
    shipping_policy_status = models.CharField(
        max_length=10,
        choices=POLICY_STATUS_CHOICES,
        default="DRAFT",
        help_text="Approval state for the Shipping Policy.",
    )
    payment_policy_status = models.CharField(
        max_length=10,
        choices=POLICY_STATUS_CHOICES,
        default="DRAFT",
        help_text="Approval state for the Payment Policy.",
    )

    # Effective Dates
    effective_date = models.DateField(
        null=True,
        blank=True,
        help_text="Official effective/operative date for business policies.",
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Business & Policy Configuration"
        verbose_name_plural = "Business & Policy Configuration"

    def save(self, *args, **kwargs):
        # Enforce singleton pattern: pk is always 1
        self.pk = 1
        if not self.created_at:
            existing = type(self).objects.filter(pk=1).values_list("created_at", flat=True).first()
            self.created_at = existing or timezone.now()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Disallow deletion of the singleton instance
        pass

    @classmethod
    def get_solo(cls):
        """
        Retrieves or initializes the singleton configuration instance.
        """
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"Business & Policy Configuration (pk={self.pk})"
