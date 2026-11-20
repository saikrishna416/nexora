from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.ImageField(
        source="product.image",
        read_only=True,
    )
    product_category = serializers.CharField(
        source="product.category.name",
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_image",
            "product_category",
            "price",
            "quantity",
            "subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_method = serializers.SerializerMethodField()
    razorpay_payment_id = serializers.SerializerMethodField()

    def get_payment_method(self, order):
        payment = getattr(order, "payment", None)
        return payment.payment_method if payment else None

    def get_razorpay_payment_id(self, order):
        payment = getattr(order, "payment", None)
        return payment.razorpay_payment_id if payment else None

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user",
            "total_amount",
            "status",
            "payment_status",
            "payment_method",
            "razorpay_payment_id",
            "shipping_address",
            "return_request",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "user",
            "total_amount",
            "status",
            "payment_status",
            "return_request",
            "items",
            "created_at",
            "updated_at",
        ]
        
class AdminOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_method = serializers.SerializerMethodField()
    razorpay_payment_id = serializers.SerializerMethodField()
    payment_transaction_id = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    username = serializers.CharField(
        source="user.username",
        read_only=True
    )
    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    def get_payment_method(self, order):
        payment = getattr(order, "payment", None)
        return payment.payment_method if payment else None

    def get_razorpay_payment_id(self, order):
        payment = getattr(order, "payment", None)
        return payment.razorpay_payment_id if payment else None

    def get_payment_transaction_id(self, order):
        payment = getattr(order, "payment", None)
        return payment.transaction_id if payment else None

    def get_customer_name(self, order):
        return " ".join(
            name for name in (order.user.first_name, order.user.last_name) if name
        ) or order.user.username

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "user",
            "username",
            "email",
            "customer_name",
            "total_amount",
            "status",
            "payment_status",
            "payment_method",
            "razorpay_payment_id",
            "payment_transaction_id",
            "shipping_address",
            "return_request",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "order_number",
            "user",
            "username",
            "email",
            "total_amount",
            "payment_status",
            "return_request",
            "items",
            "created_at",
            "updated_at",
        ]
        
class AdminOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status", "payment_status"]

    def validate_status(self, value):
        valid_statuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
        ]

        if value not in valid_statuses:
            raise serializers.ValidationError(
                "Invalid order status."
            )

        return value