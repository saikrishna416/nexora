from django.urls import path

from .views import (
    CreatePaymentView,
    RazorpayWebhookView,
    VerifyRazorpayPaymentView,
)

urlpatterns = [
    path(
        "create/",
        CreatePaymentView.as_view(),
        name="payment-create",
    ),
    path(
        "verify/",
        VerifyRazorpayPaymentView.as_view(),
        name="payment-verify",
    ),
    path(
        "webhook/razorpay/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),
]