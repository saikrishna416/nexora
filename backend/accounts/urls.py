from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    AdminUserListView,
    AdminUserDetailView,
    SavedAddressListCreateView,
    SavedAddressDetailView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("me/", ProfileView.as_view(), name="me"),
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path(
        "admin/users/<int:pk>/",
        AdminUserDetailView.as_view(),
        name="admin-user-detail",
    ),

    path("addresses/", SavedAddressListCreateView.as_view(), name="saved-address-list"),
    path("addresses/<int:pk>/", SavedAddressDetailView.as_view(), name="saved-address-detail"),
]
