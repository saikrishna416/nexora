from django.urls import path
from .views import (
    ContactInquiryCreateView,
    ContactInquiryStatusView,
    AdminOverviewView,
    AdminContactInquiryListView,
    AdminContactInquiryDetailView,
    PublicBusinessPolicyConfigView,
)

urlpatterns = [
    path("contact/", ContactInquiryCreateView.as_view(), name="contact-inquiry-create"),
    path("contact/tickets/", ContactInquiryStatusView.as_view(), name="contact-inquiry-status"),
    path("admin/overview/", AdminOverviewView.as_view(), name="admin-overview"),
    path("admin/tickets/", AdminContactInquiryListView.as_view(), name="admin-contact-inquiry-list"),
    path(
        "admin/tickets/<int:pk>/",
        AdminContactInquiryDetailView.as_view(),
        name="admin-contact-inquiry-detail",
    ),
    path("configuration/", PublicBusinessPolicyConfigView.as_view(), name="public-business-config"),
]
