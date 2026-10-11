from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product

from .models import Cart, CartItem
from .serializers import CartSerializer


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        serializer = CartSerializer(cart)

        return Response(serializer.data)


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")
        quantity = request.data.get("quantity", 1)

        if product_id is None:
            return Response(
                {"detail": "Product is required."},
                status=400
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a valid number."},
                status=400
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=400
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True
        )

        if product.stock < quantity:
            return Response(
                {
                    "detail": "Not enough stock available."
                },
                status=400
            )

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        cart_item, item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product
        )

        if item_created:
            cart_item.quantity = quantity
        else:
            new_quantity = cart_item.quantity + quantity

            if new_quantity > product.stock:
                return Response(
                    {
                        "detail": "Requested quantity exceeds available stock."
                    },
                    status=400
                )

            cart_item.quantity = new_quantity

        cart_item.save()

        serializer = CartSerializer(cart)

        return Response(
            serializer.data,
            status=201 if item_created else 200
        )

class UpdateCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        quantity = request.data.get("quantity")

        if quantity is None:
            return Response(
                {"detail": "Quantity is required."},
                status=400
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a valid number."},
                status=400
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=400
            )

        cart = get_object_or_404(
            Cart,
            user=request.user
        )

        cart_item = get_object_or_404(
            CartItem,
            id=item_id,
            cart=cart
        )

        if quantity > cart_item.product.stock:
            return Response(
                {"detail": "Requested quantity exceeds available stock."},
                status=400
            )

        cart_item.quantity = quantity
        cart_item.save()

        serializer = CartSerializer(cart)

        return Response(serializer.data)
    
    
class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        cart = get_object_or_404(
            Cart,
            user=request.user
        )

        cart_item = get_object_or_404(
            CartItem,
            id=item_id,
            cart=cart
        )

        cart_item.delete()

        serializer = CartSerializer(cart)

        return Response(serializer.data)