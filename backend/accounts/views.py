from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, ProfileSerializer


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

