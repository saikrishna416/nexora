from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        return WishlistItem.objects.filter(
            user=self.request.user
        ).select_related("product")


class AddToWishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")

        if product_id is None:
            return Response(
                {"detail": "Product is required."},
                status=400
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True
        )

        wishlist_item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product
        )

        serializer = WishlistItemSerializer(wishlist_item)

        if not created:
            return Response(
                {
                    "detail": "Product is already in your wishlist.",
                    "wishlist_item": serializer.data
                },
                status=200
            )

        return Response(serializer.data, status=201)


class RemoveFromWishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        wishlist_item = get_object_or_404(
            WishlistItem,
            id=item_id,
            user=request.user
        )

        wishlist_item.delete()

        return Response(
            {"detail": "Product removed from wishlist."},
            status=200
        )