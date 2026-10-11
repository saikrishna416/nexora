from django.db.models import Avg
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from orders.models import OrderItem

from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        product_id = self.kwargs["product_id"]

        return Review.objects.filter(
            product_id=product_id
        ).select_related("user", "product")

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        product_id = self.kwargs["product_id"]

        has_purchased = OrderItem.objects.filter(
            order__user=self.request.user,
            order__status__in=[
                "pending",
                "confirmed",
                "shipped",
                "delivered",
            ],
            product_id=product_id
        ).exists()

        if not has_purchased:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "You can review a product only after purchasing it."
            )

        serializer.save(
            user=self.request.user,
            product_id=product_id
        )


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        )