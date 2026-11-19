from django.db.models import Q
from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from orders.models import OrderItem

from .models import Review, ReviewImage
from .serializers import ReviewSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        product_id = self.kwargs["product_id"]
        return Review.objects.filter(
            product_id=product_id
        ).select_related("user", "product").prefetch_related("images")

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        product_id = self.kwargs["product_id"]

        # Enforce verified purchase: must have a paid or delivered (non-cancelled) order
        has_purchased = OrderItem.objects.filter(
            order__user=self.request.user,
            product_id=product_id,
        ).filter(
            Q(order__payment_status="paid") | Q(order__status__in=["delivered", "confirmed", "shipped"])
        ).exclude(
            order__status="cancelled"
        ).exists()

        if not has_purchased:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                "You can review a product only after purchasing it."
            )

        review = serializer.save(
            user=self.request.user,
            product_id=product_id,
            is_verified_purchase=True,
        )

        # Handle multiple photo uploads (images[] field)
        uploaded_images = self.request.FILES.getlist("images")
        for img_file in uploaded_images:
            ReviewImage.objects.create(review=review, image=img_file)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        ).prefetch_related("images")


class UserReviewListView(generics.ListAPIView):
    """Returns all reviews written by the authenticated user (for Orders page)."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        ).select_related("product").prefetch_related("images")
