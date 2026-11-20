import re
from datetime import datetime

from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import EmailField
from rest_framework.views import APIView

from orders.models import Order
from products.models import Product
from .models import BusinessPolicyConfig, ContactInquiry
from .permissions import IsAdminOrSuperuser
from .serializers import (
    AdminContactInquirySerializer,
    ContactInquiryCreateSerializer,
    ContactInquiryStatusSerializer,
    PublicBusinessPolicyConfigSerializer,
)


def get_client_ip(request):
    """
    Extracts the client's real IP address from HTTP request headers.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class ContactInquiryCreateView(APIView):
    """
    Public POST endpoint for submitting customer contact inquiries.
    Includes spam honeypot validation, IP/user-agent auditing, and input sanitization.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ContactInquiryCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        ip_address = get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")

        inquiry = serializer.save(
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return Response(
            {
                "success": True,
                "message": "Thank you for contacting Nexora. Your inquiry has been received.",
                "id": inquiry.id,
                **ContactInquiryStatusSerializer(inquiry).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ContactInquiryStatusView(APIView):
    """
    Public lookup returns status metadata only; message bodies and staff notes
    are deliberately excluded from this endpoint.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        ticket_id = request.query_params.get("ticket_id", "").strip().upper()
        email = request.query_params.get("email", "").strip()
        if bool(ticket_id) == bool(email):
            return Response(
                {"detail": "Provide either a ticket_id or an email address."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if email:
            email_serializer = EmailField()
            try:
                normalized_email = email_serializer.run_validation(email)
            except ValidationError as error:
                return Response(
                    {"detail": error.detail},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            inquiries = ContactInquiry.objects.filter(
                email__iexact=normalized_email
            ).order_by("-created_at")[:100]
            return Response(
                {
                    "tickets": ContactInquiryStatusSerializer(
                        inquiries, many=True
                    ).data
                },
                status=status.HTTP_200_OK,
            )

        ticket_match = re.fullmatch(r"NX-(\d{8})-(\d{6})", ticket_id)
        if not ticket_match:
            return Response(
                {"detail": "Enter a valid NX-YYYYMMDD-XXXXXX ticket ID."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ticket_date = datetime.strptime(ticket_match.group(1), "%Y%m%d").date()
        except ValueError:
            return Response(
                {"detail": "Ticket ID contains an invalid date."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inquiry = next(
            (
                item
                for item in ContactInquiry.objects.filter(
                    created_at__date=ticket_date
                ).order_by("-created_at")
                if item.public_ticket_id == ticket_id
            ),
            None,
        )
        if inquiry is None:
            return Response(
                {"detail": "No support enquiry was found for that ticket ID."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"tickets": [ContactInquiryStatusSerializer(inquiry).data]},
            status=status.HTTP_200_OK,
        )


class AdminOverviewView(APIView):
    permission_classes = [IsAdminOrSuperuser]

    def get(self, request, *args, **kwargs):
        orders = Order.objects.only("return_request").iterator()
        active_return_requests = sum(
            1
            for order in orders
            if order.return_request
            and order.return_request.get("status")
            not in {"completed", "rejected"}
        )
        revenue = (
            Order.objects.filter(payment_status="paid")
            .aggregate(total=Sum("total_amount"))["total"]
            or 0
        )
        return Response(
            {
                "total_orders": Order.objects.count(),
                "revenue": str(revenue),
                "product_count": Product.objects.count(),
                "user_count": get_user_model().objects.count(),
                "pending_returns_exchanges": active_return_requests,
                "open_support_tickets": ContactInquiry.objects.filter(
                    status__in=["new", "in_progress", "agent_assigned"]
                ).count(),
            },
            status=status.HTTP_200_OK,
        )


class AdminContactInquiryListView(generics.ListAPIView):
    permission_classes = [IsAdminOrSuperuser]
    serializer_class = AdminContactInquirySerializer
    queryset = ContactInquiry.objects.all()


class AdminContactInquiryDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminOrSuperuser]
    serializer_class = AdminContactInquirySerializer
    queryset = ContactInquiry.objects.all()


class PublicBusinessPolicyConfigView(APIView):
    """
    Public GET endpoint exposing the singleton Business & Policy Configuration.
    Returns only approved policy flags and non-sensitive business details.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        config = BusinessPolicyConfig.get_solo()
        serializer = PublicBusinessPolicyConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)
