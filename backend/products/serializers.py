
from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "image",
            "image_url",
            "parent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data):
        image_url = validated_data.pop("image_url", "")
        image = validated_data.get("image")
        if image_url and image:
            raise serializers.ValidationError(
                {"image": "Upload an image or provide an image URL, not both."}
            )
        if image_url:
            validated_data["image_url"] = image_url
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image = validated_data.get("image")
        image_url = validated_data.pop("image_url", None)
        if image and image_url:
            raise serializers.ValidationError(
                {"image": "Upload an image or provide an image URL, not both."}
            )
        if image:
            instance.image_url = ""
        elif image_url is not None:
            instance.image_url = image_url
            if image_url:
                instance.image = None
        return super().update(instance, validated_data)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image",
            "created_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )
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
        average = getattr(obj, "annotated_average_rating", None)
        return round(average, 1) if average is not None else None

    def get_review_count(self, obj):
        count = getattr(obj, "annotated_review_count", None)
        return count if count is not None else 0

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "name",
            "slug",
            "description",
            "price",
            "original_price",
            "stock",
            "image",
            "image_url",
            "images",
            "average_rating",
            "review_count",
            "is_active",
            "is_featured",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "category_name",
            "images",
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        image = attrs.get("image")
        image_url = attrs.get("image_url")
        if image and image_url:
            raise serializers.ValidationError(
                {"image": "Upload an image or provide an image URL, not both."}
            )
        return attrs

    def create(self, validated_data):
        image_url = validated_data.pop("image_url", "")
        if image_url:
            validated_data["image_url"] = image_url
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image = validated_data.get("image")
        image_url = validated_data.pop("image_url", None)
        if image:
            instance.image_url = ""
        elif image_url is not None:
            instance.image_url = image_url
            if image_url:
                instance.image = None
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data.get("image"):
            data["image"] = instance.image_url or None
        return data
