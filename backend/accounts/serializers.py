from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )

        return user


class NexoraTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data.update(
            {
                "id": self.user.pk,
                "username": self.user.get_username(),
                "email": self.user.email,
                "first_name": self.user.first_name,
                "last_name": self.user.last_name,
                "is_staff": self.user.is_staff,
                "is_superuser": self.user.is_superuser,
            }
        )
        return data
    

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "address",
            "profile_image",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["id", "username", "is_staff", "is_superuser"]
        

class AdminUserSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(
        source="admin_order_count",
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "is_active",
            "is_staff",
            "is_superuser",
            "orders_count",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "is_superuser",
            "orders_count",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        if request and self.instance and self.instance.pk == request.user.pk:
            if attrs.get("is_active") is False or attrs.get("is_staff") is False:
                raise serializers.ValidationError(
                    "You cannot deactivate or revoke staff access from your own account."
                )
        return attrs


from .models import SavedAddress


class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = [
            "id",
            "full_name",
            "phone_number",
            "address_line",
            "city",
            "state",
            "pincode",
            "is_default",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

