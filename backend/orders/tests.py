from decimal import Decimal
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test import SimpleTestCase
from django.urls import reverse
from products.models import Category, Product
from payments.models import Payment
from rest_framework.test import APIClient

from .models import Order, OrderItem

from .views import _selected_unit_price


class SelectedVariantPriceTests(SimpleTestCase):
    def product(self, name, category, price):
        return SimpleNamespace(
            name=name,
            category=SimpleNamespace(name=category),
            price=Decimal(price),
        )

    def test_iphone_price_is_anchored_to_title_storage(self):
        product = self.product("Apple iPhone 16 256 GB", "Mobiles", "50000")

        self.assertEqual(
            _selected_unit_price(product, {"selected_variant": "128 GB"}),
            Decimal("40000"),
        )
        self.assertEqual(
            _selected_unit_price(product, {"selected_variant": "512 GB"}),
            Decimal("70000"),
        )

    def test_tv_pricing_uses_title_screen_size_as_base(self):
        product = self.product("Smart TV 32 inch", "Electronics", "20000")

        self.assertEqual(
            _selected_unit_price(product, {"selected_variant": "55 inch"}),
            Decimal("43000"),
        )

    def test_galaxy_book_has_only_supported_configuration(self):
        product = self.product(
            "Samsung Galaxy Book 8 GB RAM 512 GB SSD", "Electronics", "80000"
        )

        self.assertEqual(
            _selected_unit_price(
                product, {"selected_variant": "16 GB RAM | 1 TB SSD"}
            ),
            Decimal("94000"),
        )
        with self.assertRaises(ValueError):
            _selected_unit_price(
                product, {"selected_variant": "16 GB RAM | 512 GB SSD"}
            )

    def test_s26_and_other_mobile_options_are_restricted(self):
        s26 = self.product(
            "Samsung Galaxy S26 12 GB RAM 256 GB", "Mobiles", "60000"
        )
        self.assertEqual(
            _selected_unit_price(
                s26, {"selected_variant": "12 GB RAM | 512 GB"}
            ),
            Decimal("72000"),
        )

        mobile = self.product("OnePlus Phone 8 GB RAM 128 GB", "Mobiles", "30000")
        self.assertEqual(
            _selected_unit_price(
                mobile, {"selected_variant": "8 GB RAM | 256 GB"}
            ),
            Decimal("33000"),
        )
        with self.assertRaises(ValueError):
            _selected_unit_price(
                mobile, {"selected_variant": "6 GB RAM | 128 GB"}
            )

    def test_refrigerator_has_no_priced_capacity_variants(self):
        product = self.product(
            "Frost Free Refrigerator 250 Litre", "Appliances", "25000"
        )

        self.assertEqual(_selected_unit_price(product, {}), Decimal("25000"))
        with self.assertRaises(ValueError):
            _selected_unit_price(product, {"selected_variant": "290 Litre"})

    def test_apparel_price_has_minimum_for_small_size(self):
        product = self.product("Basic Shirt", "Men Fashion", "120")

        self.assertEqual(
            _selected_unit_price(product, {"selected_size": "S"}),
            Decimal("99"),
        )
        self.assertEqual(
            _selected_unit_price(product, {"selected_size": "XL"}),
            Decimal("220"),
        )

    def test_unavailable_option_is_rejected(self):
        product = self.product("Basic Shirt", "Men Fashion", "120")

        with self.assertRaises(ValueError):
            _selected_unit_price(product, {"selected_size": "XXXL"})


class AdminReturnRequestAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        user_model = get_user_model()
        self.customer = user_model.objects.create_user(
            username="customer",
            email="customer@example.com",
            password="customer-password-123",
        )
        self.superuser = user_model.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="admin-password-123",
            is_superuser=True,
        )
        category = Category.objects.create(name="Fashion")
        product = Product.objects.create(
            category=category,
            name="Everyday Shirt",
            description="Cotton shirt",
            price=Decimal("100.00"),
            stock=5,
        )
        self.order = Order.objects.create(
            user=self.customer,
            total_amount=Decimal("100.00"),
            status="delivered",
            shipping_address="1 Main Street",
        )
        self.payment = Payment.objects.create(
            order=self.order,
            amount=Decimal("100.00"),
            payment_method="razorpay",
            transaction_id=f"TXN-{self.order.pk}",
        )
        self.item = OrderItem.objects.create(
            order=self.order,
            product=product,
            product_name=product.name,
            price=Decimal("100.00"),
            quantity=1,
            subtotal=Decimal("100.00"),
        )

    def test_customer_return_request_is_persisted_and_admin_can_complete_it(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post(
            reverse("order-return-request", kwargs={"pk": self.order.pk}),
            {
                "action_type": "return",
                "reason": "Damaged or defective product",
                "pickup_address": "1 Main Street",
                "selected_item_ids": [self.item.pk],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertRegex(response.data["requestId"], r"^RET-\d{8}-\d{6}$")
        self.assertEqual(
            Order.objects.get(pk=self.order.pk).return_request["status"],
            "requested",
        )

        self.client.force_authenticate(user=self.superuser)
        completion = self.client.patch(
            reverse("admin-return-request-status", kwargs={"pk": self.order.pk}),
            {"status": "completed"},
            format="json",
        )
        self.assertEqual(completion.status_code, 200)
        self.assertEqual(completion.data["status"], "completed")
        self.assertEqual(
            Order.objects.get(pk=self.order.pk).payment_status,
            "refunded",
        )
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "refunded")

    def test_regular_customer_cannot_access_admin_orders(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(reverse("admin-order-list"))
        self.assertEqual(response.status_code, 403)

    def test_admin_can_update_order_and_payment_status(self):
        self.client.force_authenticate(user=self.superuser)
        order_list = self.client.get(reverse("admin-order-list"))
        self.assertEqual(order_list.status_code, 200)
        self.assertEqual(order_list.data["results"][0]["customer_name"], "customer")
        response = self.client.patch(
            reverse("admin-order-status", kwargs={"pk": self.order.pk}),
            {"status": "processing", "payment_status": "paid"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "processing")
        self.assertEqual(response.data["payment_status"], "paid")
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "processing")
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, "success")
