from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

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
