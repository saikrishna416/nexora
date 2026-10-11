from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

from .filters import ProductFilter

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    authentication_classes = []

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
    ]

    filterset_class = ProductFilter
    search_fields = ["name", "description"]

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminUser()]
    
class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
    ]

    filterset_class = ProductFilter
    search_fields = ["name", "description"]


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer