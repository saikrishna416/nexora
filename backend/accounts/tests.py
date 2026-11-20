import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class EnsureAdminCommandTests(TestCase):
    def test_missing_configuration_skips_admin_creation(self):
        with patch.dict(
            os.environ,
            {
                "ADMIN_USERNAME": "",
                "ADMIN_EMAIL": "",
                "ADMIN_PASSWORD": "",
            },
        ):
            call_command("ensure_admin")

        self.assertFalse(
            get_user_model().objects.filter(username="render-admin").exists()
        )

    def test_command_creates_and_updates_admin_idempotently(self):
        user_model = get_user_model()
        with patch.dict(
            os.environ,
            {
                "ADMIN_USERNAME": "render-admin",
                "ADMIN_EMAIL": "admin@example.com",
                "ADMIN_PASSWORD": "initial-password",
            },
        ):
            call_command("ensure_admin")
            call_command("ensure_admin")

        user = user_model.objects.get(username="render-admin")
        self.assertEqual(user_model.objects.filter(username="render-admin").count(), 1)
        self.assertEqual(user.email, "admin@example.com")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password("initial-password"))

        with patch.dict(
            os.environ,
            {
                "ADMIN_USERNAME": "render-admin",
                "ADMIN_EMAIL": "updated-admin@example.com",
                "ADMIN_PASSWORD": "updated-password",
            },
        ):
            call_command("ensure_admin")

        user.refresh_from_db()
        self.assertEqual(user.email, "updated-admin@example.com")
        self.assertTrue(user.check_password("updated-password"))


class RoleAwareLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        get_user_model().objects.create_user(
            username="store-admin",
            email="admin@example.com",
            password="secure-password-123",
            is_staff=True,
        )

    def test_login_and_me_return_admin_flags(self):
        response = self.client.post(
            reverse("login"),
            {"username": "store-admin", "password": "secure-password-123"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_staff"])
        self.assertFalse(response.data["is_superuser"])
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )

        profile = self.client.get(reverse("me"))
        self.assertEqual(profile.status_code, 200)
        self.assertTrue(profile.data["is_staff"])
        self.assertFalse(profile.data["is_superuser"])

    def test_admin_can_list_users_but_cannot_demote_self(self):
        response = self.client.post(
            reverse("login"),
            {"username": "store-admin", "password": "secure-password-123"},
            format="json",
        )
        self.client.force_authenticate(
            user=get_user_model().objects.get(username="store-admin")
        )
        users = self.client.get(reverse("admin-user-list"), {"search": "admin"})
        self.assertEqual(users.status_code, 200)
        self.assertEqual(users.data["results"][0]["orders_count"], 0)

        self_update = self.client.patch(
            reverse(
                "admin-user-detail",
                kwargs={"pk": response.data["id"]},
            ),
            {"is_staff": False},
            format="json",
        )
        self.assertEqual(self_update.status_code, 400)

    def test_customer_cannot_list_users(self):
        customer = get_user_model().objects.create_user(
            username="customer",
            email="customer@example.com",
            password="customer-password-123",
        )
        self.client.force_authenticate(user=customer)
        response = self.client.get(reverse("admin-user-list"))
        self.assertEqual(response.status_code, 403)
