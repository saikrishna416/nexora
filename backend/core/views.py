import re
from datetime import datetime

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import EmailField
from rest_framework.views import APIView

from .models import BusinessPolicyConfig, ContactInquiry
from .serializers import (
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
