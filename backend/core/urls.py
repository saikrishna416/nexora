from django.urls import path
from .views import (
    ContactInquiryCreateView,
    ContactInquiryStatusView,
    PublicBusinessPolicyConfigView,
)

urlpatterns = [
    path("contact/", ContactInquiryCreateView.as_view(), name="contact-inquiry-create"),
    path("contact/tickets/", ContactInquiryStatusView.as_view(), name="contact-inquiry-status"),
    path("configuration/", PublicBusinessPolicyConfigView.as_view(), name="public-business-config"),
]
