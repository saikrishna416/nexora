from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Category, Product


class AdminProductAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        user_model = get_user_model()
        self.customer = user_model.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="customer-password-123",
        )
        self.admin = user_model.objects.create_user(
            username="catalog-admin",
            email="catalog-admin@example.com",
            password="admin-password-123",
            is_staff=True,
        )
        category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            category=category,
            name="Sample Laptop",
            description="A test product",
            price="1000.00",
            stock=3,
        )

    def test_admin_can_update_stock_and_selling_price(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("admin-product-detail", kwargs={"pk": self.product.pk}),
            {"price": "1200.00", "stock": 8},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(str(self.product.price), "1200.00")
        self.assertEqual(self.product.stock, 8)

    def test_customer_cannot_access_admin_products(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(reverse("admin-product-list"))
        self.assertEqual(response.status_code, 403)

    def test_admin_can_create_product_with_image_url_and_generated_slug(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("admin-product-list"),
            {
                "category": self.product.category_id,
                "name": "New Admin Product",
                "description": "Created from the dashboard",
                "price": "899.00",
                "original_price": "999.00",
                "stock": 12,
                "is_active": True,
                "is_featured": True,
                "image_url": "https://cdn.example.com/product.png",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["slug"], "new-admin-product")
        self.assertEqual(response.data["image"], "https://cdn.example.com/product.png")
        self.assertTrue(response.data["is_featured"])

    def test_admin_can_delete_unused_category(self):
        unused = Category.objects.create(name="Unused")
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("category-detail", kwargs={"pk": unused.pk})
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Category.objects.filter(pk=unused.pk).exists())

    def test_admin_cannot_delete_category_used_by_a_product(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(
            reverse("category-detail", kwargs={"pk": self.product.category_id})
        )
        self.assertEqual(response.status_code, 400)
        self.assertTrue(Category.objects.filter(pk=self.product.category_id).exists())
