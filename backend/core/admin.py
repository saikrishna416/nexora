from django.contrib import admin
from django.utils.html import format_html
from .models import (
    BusinessPolicyConfig,
    ContactInquiry,
    decode_contact_subject,
)


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "email",
        "phone",
        "order_id",
        "category_display",
        "subject_display",
        "status",
        "created_at",
    )
    list_filter = (
        "status",
        "created_at",
    )
    search_fields = (
        "name",
        "email",
        "order_id",
        "subject",
        "message",
    )
    readonly_fields = (
        "ip_address",
        "user_agent",
        "created_at",
        "updated_at",
    )
    list_editable = ("status",)
    list_per_page = 25

    @admin.display(description="Category")
    def category_display(self, obj):
        return decode_contact_subject(obj.subject)[0]

    @admin.display(description="Subject")
    def subject_display(self, obj):
        return decode_contact_subject(obj.subject)[1]

    fieldsets = (
        (
            "Customer Details",
            {
                "fields": (
                    "name",
                    "email",
                    "phone",
                    "order_id",
                )
            },
        ),
        (
            "Inquiry Content",
            {
                "fields": (
                    "subject",
                    "message",
                )
            },
        ),
        (
            "Triage & Internal Staff Notes",
            {
                "fields": (
                    "status",
                    "internal_notes",
                ),
                "description": "Staff triage and internal investigation notes. Not visible to the customer.",
            },
        ),
        (
            "Audit & Security Metadata",
            {
                "fields": (
                    "ip_address",
                    "user_agent",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            "new": "#d97706",         # amber
            "in_progress": "#2563eb", # blue
            "resolved": "#16a34a",    # green
        }
        color = colors.get(obj.status, "#64748b")
        return format_html(
            '<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;color:#fff;background-color:{};">{}</span>',
            color,
            obj.get_status_display(),
        )


@admin.register(BusinessPolicyConfig)
class BusinessPolicyConfigAdmin(admin.ModelAdmin):
    list_display = (
        "config_title",
        "support_email",
        "support_phone",
        "return_window_days",
        "refund_business_days",
        "effective_date",
        "updated_at",
    )

    fieldsets = (
        (
            "Customer Support & Contact Info",
            {
                "fields": (
                    "support_email",
                    "support_phone",
                    "business_address",
                ),
                "description": "Official business contact details displayed across policy pages and footer. Nullable/blank by default.",
            },
        ),
        (
            "Returns & Refunds Policy Configuration",
            {
                "fields": (
                    "return_window_days",
                    "refund_business_days",
                ),
                "description": "Configure the official return window (7 or 10 days) and refund timeline in business days.",
            },
        ),
        (
            "Shipping & Fulfillment Policy Configuration",
            {
                "fields": (
                    "free_shipping_enabled",
                    "free_shipping_threshold",
                    "standard_shipping_fee",
                    "order_processing_time",
                    "delivery_estimate_time",
                ),
                "description": "Fulfillment rules, shipping fees, free shipping criteria, and transit estimates.",
            },
        ),
        (
            "Individual Policy Approval Toggles",
            {
                "fields": (
                    "privacy_policy_status",
                    "terms_conditions_status",
                    "return_refund_status",
                    "shipping_policy_status",
                    "payment_policy_status",
                    "effective_date",
                ),
                "description": "Control publication status (DRAFT vs APPROVED) for each customer-facing policy.",
            },
        ),
        (
            "System Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at")

    def config_title(self, obj):
        return "Global Business & Policy Configuration"
    config_title.short_description = "Configuration"

    def has_add_permission(self, request):
        # Disallow creating multiple configuration instances (singleton pattern)
        return not BusinessPolicyConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Disallow deleting the singleton configuration
        return False
