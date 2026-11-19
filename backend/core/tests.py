from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import ContactInquiry, BusinessPolicyConfig


class ContactInquiryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("contact-inquiry-create")

    def test_submit_valid_contact_inquiry(self):
        payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "category": "Orders & Delivery",
            "phone": "+91 9876543210",
            "order_id": "NXR-A1B2C3D4E5F6",
            "subject": "Question about delivery",
            "message": "Hello, I would like to inquire about express delivery to my pin code.",
            "honeypot": "",
        }
        response = self.client.post(
            self.url,
            payload,
            format="json",
            HTTP_USER_AGENT="Mozilla/5.0 TestBrowser",
            REMOTE_ADDR="192.168.1.50",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data.get("success"))
        inquiry_id = response.data.get("id")
        self.assertIsNotNone(inquiry_id)
        self.assertRegex(response.data["ticketId"], r"^NX-\d{8}-\d{6}$")
        self.assertEqual(response.data["category"], "Orders & Delivery")
        self.assertEqual(response.data["subject"], "Question about delivery")
        self.assertEqual(response.data["status"], "new")

        # Verify database record
        inquiry = ContactInquiry.objects.get(id=inquiry_id)
        self.assertEqual(inquiry.name, "Jane Doe")
        self.assertEqual(inquiry.email, "jane@example.com")
        self.assertEqual(inquiry.order_id, "NXR-A1B2C3D4E5F6")
        self.assertEqual(inquiry.category, "Orders & Delivery")
        self.assertEqual(inquiry.customer_subject, "Question about delivery")
        self.assertEqual(inquiry.status, "new")
        self.assertEqual(inquiry.ip_address, "192.168.1.50")
        self.assertEqual(inquiry.user_agent, "Mozilla/5.0 TestBrowser")
        self.assertEqual(inquiry.internal_notes, "")

    def test_public_ticket_lookup_returns_status_without_message_or_staff_notes(self):
        response = self.client.post(
            self.url,
            {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "category": "Returns & Refunds",
                "subject": "Refund timing",
                "message": "Please tell me when my refund will be processed.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        inquiry = ContactInquiry.objects.get(id=response.data["id"])
        inquiry.status = "agent_assigned"
        inquiry.internal_notes = "Internal only: follow up with finance."
        inquiry.save()

        by_email = self.client.get(
            reverse("contact-inquiry-status"), {"email": "JANE@example.com"}
        )
        self.assertEqual(by_email.status_code, status.HTTP_200_OK)
        ticket = by_email.data["tickets"][0]
        self.assertEqual(ticket["ticketId"], inquiry.public_ticket_id)
        self.assertEqual(ticket["category"], "Returns & Refunds")
        self.assertEqual(ticket["subject"], "Refund timing")
        self.assertEqual(ticket["status"], "agent_assigned")
        self.assertEqual(ticket["statusLabel"], "Agent Assigned")
        self.assertNotIn("message", ticket)
        self.assertNotIn("internal_notes", ticket)

        by_ticket_id = self.client.get(
            reverse("contact-inquiry-status"),
            {"ticket_id": inquiry.public_ticket_id.lower()},
        )
        self.assertEqual(by_ticket_id.status_code, status.HTTP_200_OK)
        self.assertEqual(
            by_ticket_id.data["tickets"][0]["ticketId"], inquiry.public_ticket_id
        )

    def test_honeypot_spam_trap_rejection(self):
        payload = {
            "name": "Bot Spammer",
            "email": "spammer@bot.com",
            "subject": "Buy cheap watches",
            "message": "Click here to buy cheap luxury replica watches now!",
            "honeypot": "http://spam-link.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("honeypot", response.data)
        # Ensure spam was not saved
        self.assertFalse(ContactInquiry.objects.filter(email="spammer@bot.com").exists())

    def test_validation_constraints(self):
        # 1. Invalid email
        res1 = self.client.post(
            self.url,
            {
                "name": "Valid Name",
                "email": "not-an-email",
                "subject": "Valid Subject",
                "message": "This is a sufficiently long test message.",
            },
            format="json",
        )
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res1.data)

        # 2. Name too short
        res2 = self.client.post(
            self.url,
            {
                "name": "A",
                "email": "test@example.com",
                "subject": "Valid Subject",
                "message": "This is a sufficiently long test message.",
            },
            format="json",
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res2.data)

        # 3. Message too short
        res3 = self.client.post(
            self.url,
            {
                "name": "Valid Name",
                "email": "test@example.com",
                "subject": "Valid Subject",
                "message": "Short",
            },
            format="json",
        )
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", res3.data)

    def test_privacy_leak_protection(self):
        """
        Verify response never returns internal fields like internal_notes or ip_address.
        """
        payload = {
            "name": "Privacy Conscious",
            "email": "privacy@example.com",
            "subject": "Data protection inquiry",
            "message": "Please do not expose my internal audit information.",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("internal_notes", response.data)
        self.assertNotIn("ip_address", response.data)
        self.assertNotIn("user_agent", response.data)


class BusinessPolicyConfigAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("public-business-config")
        # Reset any existing singleton
        BusinessPolicyConfig.objects.all().delete()

    def test_default_unconfigured_singleton(self):
        """
        Ensures unconfigured business details are blank/null by default,
        with policy status defaulting to DRAFT and no prefilled dummy contacts.
        """
        config = BusinessPolicyConfig.get_solo()
        self.assertEqual(config.pk, 1)
        self.assertEqual(config.support_email, "")
        self.assertEqual(config.support_phone, "")
        self.assertEqual(config.business_address, "")
        self.assertIsNone(config.return_window_days)
        self.assertIsNone(config.refund_business_days)
        self.assertFalse(config.free_shipping_enabled)
        self.assertEqual(config.privacy_policy_status, "DRAFT")
        self.assertEqual(config.terms_conditions_status, "DRAFT")
        self.assertEqual(config.return_refund_status, "DRAFT")
        self.assertEqual(config.shipping_policy_status, "DRAFT")
        self.assertEqual(config.payment_policy_status, "DRAFT")

    def test_public_get_api_allow_any(self):
        """
        Verify the public read-only configuration GET API works without authentication.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Empty/unconfigured state check
        self.assertEqual(response.data["support_email"], "")
        self.assertEqual(response.data["support_phone"], "")
        self.assertEqual(response.data["business_address"], "")
        self.assertFalse(response.data["privacy_policy_approved"])
        self.assertFalse(response.data["terms_conditions_approved"])
        self.assertFalse(response.data["return_refund_approved"])
        self.assertFalse(response.data["shipping_policy_approved"])
        self.assertFalse(response.data["payment_policy_approved"])

    def test_configured_and_approved_policies_output(self):
        """
        Verify when admin configures business details and approves policies,
        the public endpoint accurately reflects them.
        """
        config = BusinessPolicyConfig.get_solo()
        config.return_window_days = 7
        config.refund_business_days = 7
        config.free_shipping_enabled = True
        config.free_shipping_threshold = Decimal("500.00")
        config.standard_shipping_fee = Decimal("50.00")
        config.order_processing_time = "1-2 business days"
        config.delivery_estimate_time = "3-5 business days"
        config.support_email = "care@nexora.com"
        config.support_phone = "+91 80000 12345"
        config.business_address = "Nexora HQ, Hyderabad, India"
        config.privacy_policy_status = "APPROVED"
        config.terms_conditions_status = "APPROVED"
        config.return_refund_status = "APPROVED"
        config.shipping_policy_status = "APPROVED"
        config.payment_policy_status = "APPROVED"
        config.save()

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["return_window_days"], 7)
        self.assertEqual(response.data["refund_business_days"], 7)
        self.assertTrue(response.data["free_shipping_enabled"])
        self.assertEqual(response.data["free_shipping_threshold"], "500.00")
        self.assertEqual(response.data["support_email"], "care@nexora.com")
        self.assertEqual(response.data["support_phone"], "+91 80000 12345")
        self.assertTrue(response.data["privacy_policy_approved"])
        self.assertTrue(response.data["terms_conditions_approved"])
        self.assertTrue(response.data["return_refund_approved"])
        self.assertTrue(response.data["shipping_policy_approved"])
        self.assertTrue(response.data["payment_policy_approved"])

    def test_singleton_enforcement(self):
        """
        Verify saving another instance forces pk=1.
        """
        c1 = BusinessPolicyConfig.objects.create(support_email="first@example.com")
        self.assertEqual(c1.pk, 1)
        c2 = BusinessPolicyConfig(support_email="second@example.com")
        c2.save()
        self.assertEqual(c2.pk, 1)
        self.assertEqual(BusinessPolicyConfig.objects.count(), 1)
        self.assertEqual(BusinessPolicyConfig.get_solo().support_email, "second@example.com")
