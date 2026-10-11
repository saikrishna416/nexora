from rest_framework.permissions import IsAdminUser
from django.db import transaction
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from products.models import Product

from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    AdminOrderSerializer,
    AdminOrderStatusSerializer,
)
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

        total_amount = sum(
            cart_item.product.price * cart_item.quantity
            for cart_item in cart_items
        )

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            shipping_address=shipping_address,
        )

        for cart_item in cart_items:
            product = cart_item.product

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                price=product.price,
                quantity=cart_item.quantity,
                subtotal=product.price * cart_item.quantity,
            )

            product.stock -= cart_item.quantity
            product.save(update_fields=["stock"])

        cart.items.all().delete()

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

        total_amount = product.price * quantity

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            shipping_address=shipping_address,
        )

        OrderItem.objects.create(
            order=order,
            product=product,
            product_name=product.name,
            price=product.price,
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
        ).prefetch_related("items")


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related("items")
        
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
        ).prefetch_related("items")


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderSerializer

    def get_queryset(self):
        return Order.objects.all().select_related(
            "user"
        ).prefetch_related("items") 
        
class AdminOrderStatusUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminOrderStatusSerializer

    def get_queryset(self):
        return Order.objects.all()