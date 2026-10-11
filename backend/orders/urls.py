from django.urls import path

from .views import (
    CreateOrderView,
    BuyNowOrderView,
    OrderListView,
    OrderDetailView,
    CancelOrderView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminOrderStatusUpdateView,
)

urlpatterns = [
    path(
        "create/",
        CreateOrderView.as_view(),
        name="order-create"
    ),
    path(
    "buy-now/",
    BuyNowOrderView.as_view(),
    name="order-buy-now",
    ),
    path(
        "",
        OrderListView.as_view(),
        name="order-list"
    ),
    path(
        "<int:pk>/",
        OrderDetailView.as_view(),
        name="order-detail"
    ),
    path(
    "<int:pk>/cancel/",
    CancelOrderView.as_view(),
    name="order-cancel"
    ),
    path("admin/", AdminOrderListView.as_view(), name="admin-order-list"),
    path(
    "admin/<int:pk>/status/",
    AdminOrderStatusUpdateView.as_view(),
    name="admin-order-status",
),
path("admin/<int:pk>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),
]