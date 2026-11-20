import re
from rest_framework import serializers
from .models import (
    BusinessPolicyConfig,
    ContactInquiry,
    decode_contact_subject,
    encode_contact_subject,
)

CONTACT_CATEGORIES = {
    "Orders & Delivery",
    "Returns & Refunds",
    "Payments",
    "Products & Availability",
    "Account & Security",
    "Other",
    "General",
}


class ContactInquiryCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for public contact inquiry submission with spam honeypot
    and strict input sanitation.
    """
    honeypot = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=True,
        default="",
        help_text="Spam trap honeypot field. Must be left empty.",
    )
    category = serializers.CharField(
        required=False,
        write_only=True,
        max_length=60,
        default="General",
    )

    class Meta:
        model = ContactInquiry
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "order_id",
            "subject",
            "message",
            "category",
            "honeypot",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate_honeypot(self, value):
        if value and value.strip():
            raise serializers.ValidationError("Spam submission detected.")
        return value

    def validate_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        if len(cleaned) > 150:
            raise serializers.ValidationError("Name cannot exceed 150 characters.")
        return cleaned

    def validate_subject(self, value):
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise serializers.ValidationError("Subject must be at least 3 characters long.")
        if len(cleaned) > 200:
            raise serializers.ValidationError("Subject cannot exceed 200 characters.")
        return cleaned

    def validate_category(self, value):
        cleaned = value.strip()
        if cleaned not in CONTACT_CATEGORIES:
            raise serializers.ValidationError("Choose a valid support category.")
        return cleaned

    def validate(self, attrs):
        category = attrs.get("category", "General")
        encoded_subject = encode_contact_subject(category, attrs["subject"])
        if len(encoded_subject) > 200:
            raise serializers.ValidationError(
                {
                    "subject": (
                        "Subject is too long for the selected category. "
                        "Please shorten it and try again."
                    )
                }
            )
        return attrs

    def validate_message(self, value):
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters long.")
        if len(cleaned) > 5000:
            raise serializers.ValidationError("Message cannot exceed 5000 characters.")
        return cleaned

    def validate_phone(self, value):
        cleaned = value.strip()
        if cleaned:
            # Allow digits, spaces, hyphens, and optional leading +
            if not re.match(r"^(\+?[0-9\s\-()]{7,20})$", cleaned):
                raise serializers.ValidationError("Please provide a valid phone number.")
        return cleaned

    def validate_order_id(self, value):
        cleaned = value.strip()
        if cleaned and len(cleaned) > 100:
            raise serializers.ValidationError("Order ID cannot exceed 100 characters.")
        return cleaned

    def create(self, validated_data):
        validated_data.pop("honeypot", None)
        category = validated_data.pop("category", "General")
        validated_data["subject"] = encode_contact_subject(
            category, validated_data["subject"]
        )
        return super().create(validated_data)


class ContactInquiryStatusSerializer(serializers.ModelSerializer):
    ticketId = serializers.CharField(source="public_ticket_id", read_only=True)
    subject = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    statusLabel = serializers.SerializerMethodField()
    latestUpdate = serializers.SerializerMethodField()

    class Meta:
        model = ContactInquiry
        fields = [
            "ticketId",
            "subject",
            "category",
            "createdAt",
            "updatedAt",
            "status",
            "statusLabel",
            "latestUpdate",
            "admin_reply",
        ]

    def get_subject(self, obj):
        return decode_contact_subject(obj.subject)[1]

    def get_category(self, obj):
        return decode_contact_subject(obj.subject)[0]

    def get_statusLabel(self, obj):
        return {
            "new": "Open / Received",
            "in_progress": "In Progress / Under Review",
            "agent_assigned": "Agent Assigned",
            "resolved": "Resolved",
        }.get(obj.status, "Open / Received")

    def get_latestUpdate(self, obj):
        return {
            "new": "Your enquiry was received and is queued for review.",
            "in_progress": "A support executive is reviewing your enquiry.",
            "agent_assigned": "A support executive has been assigned to your enquiry.",
            "resolved": (
                "Your enquiry has been resolved. Please check your email for the "
                "resolution details."
            ),
        }.get(obj.status, "Your enquiry was received and is queued for review.")


class AdminContactInquirySerializer(serializers.ModelSerializer):
    ticketId = serializers.CharField(source="public_ticket_id", read_only=True)
    subject = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ContactInquiry
        fields = [
            "id",
            "ticketId",
            "name",
            "email",
            "phone",
            "order_id",
            "subject",
            "category",
            "message",
            "status",
            "admin_reply",
            "internal_notes",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "ticketId",
            "name",
            "email",
            "phone",
            "order_id",
            "subject",
            "category",
            "message",
            "createdAt",
            "updatedAt",
        ]

    def get_subject(self, obj):
        return decode_contact_subject(obj.subject)[1]

    def get_category(self, obj):
        return decode_contact_subject(obj.subject)[0]


class PublicBusinessPolicyConfigSerializer(serializers.ModelSerializer):
    """
    Public read-only serializer exposing approved policy status flags
    and non-sensitive business contact/shipping details.
    """
    privacy_policy_approved = serializers.SerializerMethodField()
    terms_conditions_approved = serializers.SerializerMethodField()
    return_refund_approved = serializers.SerializerMethodField()
    shipping_policy_approved = serializers.SerializerMethodField()
    payment_policy_approved = serializers.SerializerMethodField()

    class Meta:
        model = BusinessPolicyConfig
        fields = [
            # 7 Configurable Business Details
            "return_window_days",
            "refund_business_days",
            "free_shipping_enabled",
            "free_shipping_threshold",
            "standard_shipping_fee",
            "order_processing_time",
            "delivery_estimate_time",
            "support_email",
            "support_phone",
            "business_address",
            # Policy Approval Statuses & Flags
            "privacy_policy_status",
            "terms_conditions_status",
            "return_refund_status",
            "shipping_policy_status",
            "payment_policy_status",
            "privacy_policy_approved",
            "terms_conditions_approved",
            "return_refund_approved",
            "shipping_policy_approved",
            "payment_policy_approved",
            # Effective Dates & Timestamps
            "effective_date",
            "updated_at",
        ]
        read_only_fields = fields

    def get_privacy_policy_approved(self, obj) -> bool:
        return obj.privacy_policy_status == "APPROVED"

    def get_terms_conditions_approved(self, obj) -> bool:
        return obj.terms_conditions_status == "APPROVED"

    def get_return_refund_approved(self, obj) -> bool:
        return obj.return_refund_status == "APPROVED"

    def get_shipping_policy_approved(self, obj) -> bool:
        return obj.shipping_policy_status == "APPROVED"

    def get_payment_policy_approved(self, obj) -> bool:
        return obj.payment_policy_status == "APPROVED"
