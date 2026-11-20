import re

from django.db.models import Avg, Count, Prefetch, Q
from django.db.models.deletion import ProtectedError
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage
from rest_framework import generics
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from core.permissions import IsAdminOrSuperuser

from .serializers import CategorySerializer, ProductSerializer
from .filters import ProductFilter


def _search_word_variants(word):
    variants = {word}
    if word.endswith("ies") and len(word) > 4:
        variants.add(f"{word[:-3]}y")
    elif word.endswith(("ches", "shes", "xes", "zes", "sses")) and len(word) > 4:
        variants.add(word[:-2])
    elif word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        variants.add(word[:-1])
    else:
        if word.endswith("y") and len(word) > 2 and word[-2] not in "aeiou":
            variants.add(f"{word[:-1]}ies")
        elif word.endswith(("s", "x", "z", "ch", "sh")):
            variants.add(f"{word}es")
        else:
            variants.add(f"{word}s")
    return variants


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminOrSuperuser()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminOrSuperuser()]

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as error:
            raise ValidationError(
                {"detail": "This category still contains products and cannot be deleted."}
            ) from error


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    authentication_classes = []

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_class = ProductFilter

    def get_queryset(self):
        qs = (
            Product.objects
            .select_related("category")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.all(),
                )
            )
            .annotate(
                annotated_average_rating=Avg("reviews__rating"),
                annotated_review_count=Count("reviews", distinct=True),
            )
        )
        search_query = self.request.query_params.get("search", "").strip()
        if search_query:
            tokens = re.findall(r"[a-z0-9]+", search_query.lower().replace("'", "").replace("’", ""))
            q_filter = Q()
            for token in tokens:
                if token in {"men", "mens", "man"}:
                    token_q = (
                        Q(name__icontains="men")
                        | Q(name__icontains="mens")
                        | Q(name__icontains="man")
                        | Q(category__name__icontains="men")
                        | Q(category__name__icontains="mens")
                        | Q(category__name__icontains="man")
                    )
                    q_filter &= token_q & ~(
                        Q(name__icontains="women")
                        | Q(name__icontains="woman")
                        | Q(name__icontains="female")
                        | Q(category__name__icontains="women")
                        | Q(category__name__icontains="woman")
                        | Q(category__name__icontains="female")
                    )
                    continue
                if token in {"women", "womens", "woman", "female"}:
                    token_q = (
                        Q(name__icontains="women")
                        | Q(name__icontains="woman")
                        | Q(name__icontains="female")
                        | Q(category__name__icontains="women")
                        | Q(category__name__icontains="woman")
                        | Q(category__name__icontains="female")
                    )
                    q_filter &= token_q
                    continue

                token_q = Q()
                for variant in _search_word_variants(token):
                    token_q |= (
                        Q(name__icontains=variant)
                        | Q(category__name__icontains=variant)
                    )
                q_filter &= token_q
            if tokens:
                qs = qs.filter(q_filter)
        return qs

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminOrSuperuser()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAdminOrSuperuser()]
    
class AdminProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrSuperuser]
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
    ]

    filterset_class = ProductFilter
    search_fields = ["name", "category__name"]


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrSuperuser]
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as error:
            raise ValidationError(
                {"detail": "This product is part of an order and cannot be deleted."}
            ) from error