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
            "items",
            "created_at",
            "updated_at",
        ]
        
class AdminOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_method = serializers.SerializerMethodField()
    razorpay_payment_id = serializers.SerializerMethodField()
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

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "username",
            "email",
            "total_amount",
            "status",
            "payment_status",
            "payment_method",
            "razorpay_payment_id",
            "shipping_address",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "email",
            "total_amount",
            "payment_status",
            "items",
            "created_at",
            "updated_at",
        ]
        
class AdminOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]

    def validate_status(self, value):
        valid_statuses = [
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
        ]

        if value not in valid_statuses:
            raise serializers.ValidationError(
                "Invalid order status."
            )

        return value