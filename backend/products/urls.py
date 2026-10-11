from django.urls import path

from .views import (
    CategoryListCreateView,
    CategoryDetailView,
    ProductListCreateView,
    ProductDetailView,
    AdminProductListCreateView,
    AdminProductDetailView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

    path("", ProductListCreateView.as_view(), name="product-list-create"),
    path("<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("admin/", AdminProductListCreateView.as_view(), name="admin-product-list"),
    path(
        "admin/<int:pk>/",
        AdminProductDetailView.as_view(),
        name="admin-product-detail",
    ),
]