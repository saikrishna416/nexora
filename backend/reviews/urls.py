from django.urls import path

from .views import (
    ProductReviewListCreateView,
    ReviewDetailView,
    UserReviewListView,
)

urlpatterns = [
    path(
        "products/<int:product_id>/",
        ProductReviewListCreateView.as_view(),
        name="product-reviews"
    ),
    path(
        "my-reviews/",
        UserReviewListView.as_view(),
        name="my-reviews"
    ),
    path(
        "<int:pk>/",
        ReviewDetailView.as_view(),
        name="review-detail"
    ),
]
