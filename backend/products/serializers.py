from django.db.models import Avg, Count
from rest_framework import serializers

from reviews.models import Review

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "created_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    def get_average_rating(self, obj):
        result = obj.reviews.aggregate(average=Avg("rating"))
        average = result["average"]
        return round(average, 1) if average is not None else None
    def get_review_count(self, obj):
        return obj.reviews.count()

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "description",
            "price",
            "stock",
            "image",
            "images",
            "average_rating",
            "review_count",
            "is_active",
            "created_at",
            "updated_at",
        ]
