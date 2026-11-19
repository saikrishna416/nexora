import re
from decimal import Decimal

from rest_framework.permissions import IsAdminUser
from django.db import transaction
from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from products.models import Product

from .models import Order, OrderItem, generate_buy_now_order_number
from .serializers import (
    OrderSerializer,
    AdminOrderSerializer,
    AdminOrderStatusSerializer,
)


VARIANT_PRICE_OPTIONS = {
    "iphone": {
        "128 GB": ("128", 0, Decimal("1000")),
        "256 GB": ("256", 10000, None),
        "512 GB": ("512", 30000, None),
    },
    "mobile": {
        "8 GB RAM | 128 GB": ("8/128", 0, None),
        "8 GB RAM | 256 GB": ("8/256", 3000, None),
        "12 GB RAM | 256 GB": ("12/256", 6000, None),
    },
    "s26_mobile": {
        "12 GB RAM | 256 GB": ("12/256", 0, None),
        "12 GB RAM | 512 GB": ("12/512", 12000, None),
    },
    "laptop": {
        "8 GB RAM | 512 GB SSD": ("8/512", 0, None),
        "16 GB RAM | 512 GB SSD": ("16/512", 6000, None),
        "16 GB RAM | 1 TB SSD": ("16/1024", 14000, None),
    },
    "galaxy_book_laptop": {
        "8 GB RAM | 512 GB SSD": ("8/512", 0, None),
        "16 GB RAM | 1 TB SSD": ("16/1024", 14000, None),
    },
    "television": {
        "32 inch": ("32", -8000, None),
        "43 inch": ("43", 0, None),
        "55 inch": ("55", 15000, None),
    },
    "apparel": {
        "S": ("S", -50, Decimal("99")),
        "M": ("M", 0, None),
        "L": ("L", 0, None),
        "XL": ("XL", 100, None),
        "XXL": ("XXL", 200, None),
    },
    "footwear": {
        "UK 6": ("6", 0, None),
        "UK 7": ("7", 0, None),
        "UK 8": ("8", 100, None),
        "UK 9": ("9", 150, None),
        "UK 10": ("10", 200, None),
    },
}


def _variant_type(product):
    name = product.name.lower()
    category = product.category.name.lower()
    if re.search(r"\biphone\b", name):
        return "iphone"
    if re.search(r"\bgalaxy\s+book\b", name):
        return "galaxy_book_laptop"
    if re.search(r"\bs26\b", name):
        return "s26_mobile"
    if re.search(
        r"\b(laptop|macbook|book|ideapad|pavilion|inspiron|vivobook|thinkpad|victus|rog|tuf)\b",
        name,
    ):
        return "laptop"
    if re.search(r"\b(tv|television|bravia|qled|oled|uhd|smart tv)\b", name):
        return "television"
    if re.search(r"\b(shoes?|sneakers?|footwear|sandals?|slippers?)\b", f"{category} {name}"):
        return "footwear"
    if re.search(r"\b(clothing|fashion|apparel|women|men|kids|children)\b", category) or re.search(
        r"\b(shirts?|t shirts?|tshirts?|kurtas?|dresses|jeans|hoodies|jackets)\b",
        name,
    ):
        return "apparel"
    if re.search(r"\b(mobiles?|smartphones?|smart phone|tablets?)\b", category) or re.search(
        r"\b(mobile phone|smartphone|smart phone|samsung|iqoo|oneplus|xiaomi|redmi|realme|oppo|vivo)\b",
        name,
    ):
        return "mobile"
    return ""


def _base_variant_key(product, variant_type, options):
    if variant_type in {
        "apparel",
        "footwear",
        "s26_mobile",
        "galaxy_book_laptop",
    }:
        defaults = {
            "apparel": "M",
            "footwear": "6",
            "s26_mobile": "12/256",
            "galaxy_book_laptop": "8/512",
        }
        default_key = defaults[variant_type]
        if default_key in {entry[0] for entry in options.values()}:
            return default_key
        return next(iter(options.values()))[0]

    name = product.name
    patterns = {
        "iphone": (r"\b(128|256|512)\s*gb\b", lambda match: match.group(1)),
        "mobile": (
            r"\b(8|12)\s*gb\s*ram\b.*?\b(128|256)\s*gb\b",
            lambda match: f"{match.group(1)}/{match.group(2)}",
        ),
        "laptop": (
            r"\b(8|16)\s*gb\s*ram\b.*?\b(512|1024|1)\s*(gb|tb)\s*ssd\b",
            lambda match: f"{match.group(1)}/{1024 if match.group(3).lower() == 'tb' else match.group(2)}",
        ),
        "television": (
            r"\b(32|43|55)\s*(?:inch|inches|\")",
            lambda match: match.group(1),
        ),
        "apparel": (
            r"\bsize\s*(S|M|L|XL|XXL)\b",
            lambda match: match.group(1).upper(),
        ),
        "footwear": (
            r"\b(?:uk\s*|size\s*)(6|7|8|9|10)\b",
            lambda match: match.group(1),
        ),
    }
    pattern, key_for_match = patterns[variant_type]
    match = re.search(pattern, name, re.IGNORECASE)
    if match:
        key = key_for_match(match)
        if key in {entry[0] for entry in options.values()}:
            return key
    defaults = {
        "iphone": "256",
        "mobile": "8/128",
        "s26_mobile": "12/256",
        "laptop": "8/512",
        "galaxy_book_laptop": "8/512",
        "television": "43",
    }
    return defaults[variant_type]


def _selected_unit_price(product, selection):
    variant_type = _variant_type(product)
    base_price = product.price
    if not variant_type:
        if selection.get("selected_variant") or selection.get("selected_size"):
            raise ValueError("This product does not have a selectable priced variant.")
        return base_price

    options = VARIANT_PRICE_OPTIONS[variant_type]
    is_size = variant_type in {"apparel", "footwear"}
    selected_label = selection.get("selected_size" if is_size else "selected_variant")
    if not selected_label:
        return base_price
    selected_label = str(selected_label).strip()
    if variant_type == "footwear" and re.fullmatch(r"(?:UK\s*)?\d+", selected_label, re.I):
        selected_label = f"UK {selected_label.upper().replace('UK', '').strip()}"
    option = options.get(selected_label)
    if not option:
        raise ValueError("The selected size or variant is not available for this product.")

    base_key = _base_variant_key(product, variant_type, options)
    base_option = next(
        (entry for entry in options.values() if entry[0] == base_key),
        options.get(
            {
                "iphone": "256 GB",
                "mobile": "8 GB RAM | 128 GB",
                "s26_mobile": "12 GB RAM | 256 GB",
                "laptop": "8 GB RAM | 512 GB SSD",
                "galaxy_book_laptop": "8 GB RAM | 512 GB SSD",
                "television": "43 inch",
                "apparel": "M",
                "footwear": "UK 6",
            }[variant_type]
        ),
    )
    selected_delta = Decimal(str(option[1]))
    base_delta = Decimal(str(base_option[1]))
    price = base_price + selected_delta - base_delta
    minimum = option[2]
    if minimum is not None:
        price = max(price, minimum)
    return price


def _order_item_name(product, selection):
    labels = []
    if selection.get("selected_size"):
        labels.append(f"Size: {selection['selected_size']}")
    if selection.get("selected_variant"):
        labels.append(f"Variant: {selection['selected_variant']}")
    if selection.get("selected_color"):
        labels.append(f"Color: {selection['selected_color']}")
    suffix = f" — {' · '.join(labels)}" if labels else ""
    return f"{product.name}{suffix}"[:200]


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        shipping_address = request.data.get("shipping_address")

        if not shipping_address:
            return Response(
                {"detail": "Shipping address is required."},
                status=400
            )

        cart = Cart.objects.filter(
            user=request.user
        ).first()

        if not cart:
            return Response(
                {"detail": "Cart is empty."},
                status=400
            )

        cart_items = cart.items.select_related("product").all()

        if not cart_items.exists():
            return Response(
                {"detail": "Cart is empty."},
                status=400
            )

        selected_items = request.data.get("selected_items", [])
        if not isinstance(selected_items, list):
            return Response({"detail": "Selected item data must be a list."}, status=400)
        selections_by_product = {}
        for item_selection in selected_items:
            if not isinstance(item_selection, dict) or not item_selection.get("product"):
                return Response({"detail": "Selected item data is invalid."}, status=400)
            product_key = str(item_selection["product"])
            if product_key in selections_by_product:
                return Response(
                    {"detail": "Selected item data contains duplicate products."},
                    status=400,
                )
            selections_by_product[product_key] = item_selection

        priced_cart_items = []
        for cart_item in cart_items:
            if not cart_item.product.is_active:
                return Response(
                    {
                        "detail": (
                            f"{cart_item.product.name} "
                            "is no longer available."
                        )
                    },
                    status=400
                )

            if cart_item.quantity > cart_item.product.stock:
                return Response(
                    {
                        "detail": (
                            f"Not enough stock for "
                            f"{cart_item.product.name}."
                        )
                    },
                    status=400
                )

            selection = selections_by_product.get(str(cart_item.product_id), {})
            try:
                unit_price = _selected_unit_price(cart_item.product, selection)
            except ValueError as error:
                return Response({"detail": str(error)}, status=400)
            priced_cart_items.append((cart_item, selection, unit_price))

        total_amount = sum(
            unit_price * cart_item.quantity
            for cart_item, _selection, unit_price in priced_cart_items
        )

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            shipping_address=shipping_address,
        )

        for cart_item, selection, unit_price in priced_cart_items:
            product = cart_item.product

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=_order_item_name(product, selection),
                price=unit_price,
                quantity=cart_item.quantity,
                subtotal=unit_price * cart_item.quantity,
            )

            product.stock -= cart_item.quantity
            product.save(update_fields=["stock"])

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=201
        )


class BuyNowOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        product_id = request.data.get("product")
        quantity = request.data.get("quantity", 1)
        shipping_address = request.data.get("shipping_address")

        if not product_id:
            return Response(
                {"detail": "Product is required."},
                status=400,
            )

        if not shipping_address:
            return Response(
                {"detail": "Shipping address is required."},
                status=400,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a positive integer."},
                status=400,
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=400,
            )

        product = Product.objects.select_for_update().filter(
            id=product_id,
            is_active=True,
        ).first()

        if not product:
            return Response(
                {"detail": "Product not found or unavailable."},
                status=404,
            )

        if quantity > product.stock:
            return Response(
                {"detail": "Not enough stock available."},
                status=400,
            )

        selection = {
            key: request.data[key]
            for key in ("selected_size", "selected_variant", "selected_color")
            if request.data.get(key)
        }
        try:
            unit_price = _selected_unit_price(product, selection)
        except ValueError as error:
            return Response({"detail": str(error)}, status=400)

        total_amount = unit_price * quantity

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            shipping_address=shipping_address,
            order_number=generate_buy_now_order_number(),
        )

        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=_order_item_name(product, selection),
            price=unit_price,
            quantity=quantity,
            subtotal=total_amount,
        )

        product.stock -= quantity
        product.save(update_fields=["stock"])

        serializer = OrderSerializer(order)

        return Response(serializer.data, status=201)


class OrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).select_related("payment").prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product__category"))
        )


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).select_related("payment").prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product__category"))
        )
        
class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def patch(self, request, pk):
        order = Order.objects.select_for_update().filter(
            id=pk,
            user=request.user
        ).first()

        if not order:
            return Response(
                {"detail": "Order not found."},
                status=404
            )

        # Allow cancellation for pending and confirmed orders
        if order.status not in ["pending", "confirmed"]:
            return Response(
                {
                    "detail": (
                        "Only pending or confirmed orders can be cancelled."
                    )
                },
                status=400
            )

        # Restore product stock
        for item in order.items.select_related("product").all():
            item.product.stock += item.quantity
            item.product.save(update_fields=["stock"])

        # Mark order as cancelled
        order.status = "cancelled"
        order.save(update_fields=["status", "updated_at"])

        serializer = OrderSerializer(order)

        return Response({
            "message": "Order cancelled successfully.",
            "order": serializer.data
        }, status=200)
    
class AdminOrderListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer

    def get_queryset(self):
        return Order.objects.all().select_related(
            "user"
        ).select_related("payment").prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product__category"))
        )


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer

    def get_queryset(self):
        return Order.objects.all().select_related(
            "user"
        ).select_related("payment").prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.select_related("product__category"))
        )
        
class AdminOrderStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderStatusSerializer

    def get_queryset(self):
        return Order.objects.all()