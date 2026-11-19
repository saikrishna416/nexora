import hashlib
import hmac
import json
import uuid
from decimal import Decimal, ROUND_HALF_UP

import razorpay

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from orders.models import BUY_NOW_ORDER_PREFIX, Order
from .models import Payment
from .serializers import PaymentSerializer


def get_razorpay_client():
    key_id = getattr(settings, "RAZORPAY_KEY_ID", "")
    key_secret = getattr(settings, "RAZORPAY_KEY_SECRET", "")

    if not key_id or not key_secret:
        return None

    return razorpay.Client(auth=(key_id, key_secret))


def amount_in_paise(amount):
    return int(
        (Decimal(amount) * 100).quantize(
            Decimal("1"),
            rounding=ROUND_HALF_UP,
        )
    )


def is_buy_now_payment(payment):
    return payment.transaction_id.startswith("BUY-NOW-")


def is_buy_now_order(order):
    return order.order_number.startswith(BUY_NOW_ORDER_PREFIX)


def clear_ordered_cart_items(order):
    cart = Cart.objects.filter(user=order.user).first()
    if not cart:
        return

    for product_id, quantity in order.items.values_list(
        "product_id",
        "quantity",
    ):
        cart.items.filter(
            product_id=product_id,
            quantity=quantity,
        ).delete()


class CreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        order_id = request.data.get("order")
        payment_method = request.data.get("payment_method")

        if not order_id:
            return Response(
                {"detail": "Order is required."},
                status=400,
            )

        if payment_method not in ("razorpay", "cod"):
            return Response(
                {"detail": "Choose Razorpay or Cash on Delivery."},
                status=400,
            )

        order = Order.objects.select_for_update().filter(
            id=order_id,
            user=request.user,
        ).first()

        if not order:
            return Response(
                {"detail": "Order not found."},
                status=404,
            )

        if order.status == "cancelled":
            return Response(
                {"detail": "Cannot pay for a cancelled order."},
                status=400,
            )

        if order.payment_status == "paid":
            return Response(
                {"detail": "Order has already been paid."},
                status=400,
            )

        payment, _ = Payment.objects.get_or_create(
            order=order,
            defaults={
                "amount": order.total_amount,
                "payment_method": payment_method,
                "transaction_id": (
                    "BUY-NOW-PENDING-"
                    if is_buy_now_order(order)
                    else "PENDING-"
                ) + uuid.uuid4().hex,
                "status": "pending",
            },
        )
        buy_now = (
            is_buy_now_order(order)
            or is_buy_now_payment(payment)
        )

        if payment.status == "success":
            if (
                not buy_now
                and order.status != "cancelled"
                and order.payment_status == "paid"
            ):
                clear_ordered_cart_items(order)
            return Response(
                {"detail": "This order has already been paid."},
                status=400,
            )

        # Cash on Delivery
        if payment_method == "cod":
            payment.payment_method = "cod"
            payment.amount = order.total_amount
            payment.razorpay_order_id = ""
            payment.razorpay_payment_id = None
            payment.transaction_id = (
                "BUY-NOW-COD-" if buy_now else "COD-"
            ) + uuid.uuid4().hex
            payment.status = "pending"
            payment.save()

            order.payment_status = "pending"
            order.status = "pending"
            order.save(
                update_fields=[
                    "payment_status",
                    "status",
                    "updated_at",
                ]
            )

            if not buy_now:
                clear_ordered_cart_items(order)

            return Response({
                "payment": PaymentSerializer(payment).data,
                "order_id": order.id,
                "order_number": order.order_number,
                "order_status": order.status,
                "payment_status": order.payment_status,
                "message": "Cash on Delivery selected. Payment is pending.",
            })

        # Razorpay
        client = get_razorpay_client()

        if client is None:
            return Response(
                {
                    "detail": (
                        "Razorpay is not configured. "
                        "Add the test API keys to the backend environment."
                    )
                },
                status=503,
            )

        amount = amount_in_paise(order.total_amount)

        if amount <= 0:
            return Response(
                {"detail": "Order amount must be greater than zero."},
                status=400,
            )

        user_name = " ".join(filter(None, [
            getattr(request.user, "first_name", ""),
            getattr(request.user, "last_name", ""),
        ])) or getattr(request.user, "username", "Nexora Customer")

        user_email = getattr(request.user, "email", "") or ""
        phone = str(request.data.get("phone", "")).strip()

        customer_id = ""
        try:
            customer_payload = {
                "name": user_name,
                "fail_existing": 0,
            }
            if user_email:
                customer_payload["email"] = user_email
            if phone:
                customer_payload["contact"] = f"+91{phone}"

            razorpay_customer = client.customer.create(data=customer_payload)
            customer_id = razorpay_customer.get("id", "")
        except Exception as cust_err:
            print("Razorpay customer create skipped:", repr(cust_err))
            customer_id = ""

        try:
            razorpay_order = client.order.create(data={
                "amount": amount,
                "currency": "INR",
                "receipt": order.order_number,
                "notes": {
                    "nexora_order_id": str(order.id),
                    "nexora_order_number": order.order_number,
                    "user_id": str(request.user.id),
                    "nexora_order_source": "buy_now" if buy_now else "cart",
                },
            })

        except Exception as e:
            import traceback

            print("\n========== RAZORPAY ORDER ERROR ==========")
            print("ERROR:", repr(e))
            traceback.print_exc()
            print("==========================================\n")
            return Response(
                {
                    "detail": (
                        f"Razorpay error: {str(e)}"
                        if settings.DEBUG
                        else "Could not create a Razorpay order. Please try again."
                    )
                },
                status=502,
            )

        payment.payment_method = "razorpay"
        payment.amount = order.total_amount
        payment.razorpay_order_id = razorpay_order["id"]
        payment.razorpay_payment_id = None
        payment.transaction_id = (
            "BUY-NOW-PENDING-" if buy_now else "PENDING-"
        ) + uuid.uuid4().hex
        payment.status = "pending"
        payment.save()

        order.payment_status = "pending"
        order.status = "pending"
        order.save(
            update_fields=[
                "payment_status",
                "status",
                "updated_at",
            ]
        )

        return Response({
            "key_id": settings.RAZORPAY_KEY_ID,
            "razorpay_order_id": razorpay_order["id"],
            "customer_id": customer_id,
            "amount": amount,
            "currency": "INR",
            "order_id": order.id,
            "order_number": order.order_number,
            "name": user_name,
            "email": user_email,
            "payment": PaymentSerializer(payment).data,
        }, status=201)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        ]):
            return Response(
                {"detail": "Razorpay payment details are incomplete."},
                status=400,
            )

        payment = Payment.objects.select_for_update().select_related(
            "order"
        ).filter(
            razorpay_order_id=razorpay_order_id,
            order__user=request.user,
        ).first()

        if not payment:
            return Response(
                {"detail": "Payment order not found."},
                status=404,
            )

        if (
            payment.status == "success"
            and payment.razorpay_payment_id == razorpay_payment_id
        ):
            if (
                not (
                    is_buy_now_order(payment.order)
                    or is_buy_now_payment(payment)
                )
                and payment.order.status != "cancelled"
                and payment.order.payment_status == "paid"
            ):
                clear_ordered_cart_items(payment.order)
            return Response({
                "message": "Payment already verified.",
                "order_id": payment.order_id,
                "order_number": payment.order.order_number,
                "payment_status": payment.order.payment_status,
                "order_status": payment.order.status,
            })

        client = get_razorpay_client()

        if client is None:
            return Response(
                {"detail": "Razorpay is not configured on the server."},
                status=503,
            )

        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            })

            provider_payment = client.payment.fetch(
                razorpay_payment_id
            )

            provider_status = provider_payment.get("status")
            expected_amount = amount_in_paise(payment.amount)

            if (
                int(provider_payment.get("amount", -1))
                != expected_amount
                or provider_payment.get("currency") != "INR"
            ):
                return Response(
                    {"detail": "Payment amount does not match the order."},
                    status=400,
                )

            if provider_payment.get("order_id") != razorpay_order_id:
                return Response(
                    {"detail": "Payment does not belong to this order."},
                    status=400,
                )

            if provider_status == "authorized":
                client.payment.capture(
                    razorpay_payment_id,
                    {
                        "amount": expected_amount,
                        "currency": "INR",
                    },
                )

                provider_payment = client.payment.fetch(
                    razorpay_payment_id
                )
                provider_status = provider_payment.get("status")

            if provider_status != "captured":
                return Response(
                    {
                        "detail": (
                            "Payment is not captured yet. "
                            "Please wait and retry."
                        )
                    },
                    status=409,
                )

        except razorpay.errors.SignatureVerificationError:
            return Response(
                {"detail": "Razorpay signature verification failed."},
                status=400,
            )

        except Exception:
            return Response(
                {
                    "detail": (
                        "Unable to verify payment with Razorpay. "
                        "Please retry."
                    )
                },
                status=502,
            )

        buy_now = (
            is_buy_now_order(payment.order)
            or is_buy_now_payment(payment)
        )
        payment.razorpay_payment_id = razorpay_payment_id
        payment.transaction_id = (
            f"BUY-NOW-{razorpay_payment_id}"
            if buy_now
            else razorpay_payment_id
        )
        payment.payment_method = "razorpay"
        payment.status = "success"

        payment.save(update_fields=[
            "razorpay_payment_id",
            "transaction_id",
            "payment_method",
            "status",
            "updated_at",
        ])

        order = payment.order

        if order.status == "cancelled":
            return Response(
                {
                    "detail": (
                        "Payment received for a cancelled order. "
                        "Contact support."
                    )
                },
                status=409,
            )

        order.payment_status = "paid"
        order.status = "pending"
        order.save(
            update_fields=[
                "payment_status",
                "status",
                "updated_at",
            ]
        )

        if not buy_now:
            clear_ordered_cart_items(order)

        return Response({
            "message": "Razorpay payment verified successfully.",
            "order_id": order.id,
            "order_number": order.order_number,
            "order_status": order.status,
            "payment_status": order.payment_status,
            "payment_id": razorpay_payment_id,
        })


@method_decorator(csrf_exempt, name="dispatch")
class RazorpayWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        webhook_secret = getattr(
            settings,
            "RAZORPAY_WEBHOOK_SECRET",
            "",
        )

        signature = request.headers.get(
            "X-Razorpay-Signature",
            "",
        )

        if not webhook_secret or not signature:
            return HttpResponse(status=400)

        expected = hmac.new(
            webhook_secret.encode("utf-8"),
            request._request.body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            return HttpResponse(status=400)

        try:
            event = json.loads(
                request._request.body.decode("utf-8")
            )

            event_name = event.get("event")
            entity = event["payload"]["payment"]["entity"]

            gateway_order_id = entity.get("order_id")
            gateway_payment_id = entity.get("id")

        except (ValueError, KeyError, TypeError):
            return HttpResponse(status=400)

        if event_name not in (
            "payment.captured",
            "payment.failed",
        ):
            return HttpResponse(status=200)

        with transaction.atomic():
            payment = Payment.objects.select_for_update().select_related(
                "order"
            ).filter(
                razorpay_order_id=gateway_order_id
            ).first()

            if not payment:
                return HttpResponse(status=200)

            buy_now = (
                is_buy_now_order(payment.order)
                or is_buy_now_payment(payment)
            )

            if payment.status == "success":
                if (
                    not buy_now
                    and payment.order.status != "cancelled"
                    and payment.order.payment_status == "paid"
                ):
                    clear_ordered_cart_items(payment.order)
                return HttpResponse(status=200)

            if event_name == "payment.captured":
                if (
                    int(entity.get("amount", -1))
                    != amount_in_paise(payment.amount)
                ):
                    return HttpResponse(status=400)

                payment.status = "success"
                payment.razorpay_payment_id = gateway_payment_id
                payment.transaction_id = (
                    f"BUY-NOW-{gateway_payment_id}"
                    if buy_now
                    else gateway_payment_id
                )

                payment.save(update_fields=[
                    "status",
                    "razorpay_payment_id",
                    "transaction_id",
                    "updated_at",
                ])

                order = payment.order

                if order.status != "cancelled":
                    order.payment_status = "paid"
                    order.save(
                        update_fields=[
                            "payment_status",
                            "updated_at",
                        ]
                    )
                    if not buy_now:
                        clear_ordered_cart_items(order)

            else:
                payment.status = "failed"
                payment.save(
                    update_fields=["status", "updated_at"]
                )

                order = payment.order

                if order.payment_status != "paid":
                    order.payment_status = "failed"
                    order.save(
                        update_fields=[
                            "payment_status",
                            "updated_at",
                        ]
                    )

        return HttpResponse(status=200)