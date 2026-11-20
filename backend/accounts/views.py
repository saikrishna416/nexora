from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import generics
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from core.permissions import IsAdminOrSuperuser
from .serializers import (
    AdminUserSerializer,
    NexoraTokenObtainPairSerializer,
    ProfileSerializer,
    RegisterSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    serializer_class = NexoraTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]



class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminOrSuperuser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.annotate(
        admin_order_count=Count("orders", distinct=True)
    ).order_by("id")
    filter_backends = [SearchFilter]
    search_fields = ["username", "email", "first_name", "last_name"]


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminOrSuperuser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.annotate(
        admin_order_count=Count("orders", distinct=True)
    ).order_by("id")
    

from .models import SavedAddress
from .serializers import SavedAddressSerializer


class SavedAddressListCreateView(generics.ListCreateAPIView):
    serializer_class = SavedAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedAddress.objects.filter(
            user=self.request.user
        ).order_by("-is_default", "-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavedAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedAddress.objects.filter(
            user=self.request.user
        )

