from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


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
