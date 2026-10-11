
import uuid

from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from .models import Payment
from .serializers import PaymentSerializer


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

        if payment_method not in ["card", "upi", "cod"]:
            return Response(
                {"detail": "Invalid payment method."},
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

        existing_payment = Payment.objects.filter(
            order=order
        ).first()

        if existing_payment:
            return Response(
                {
                    "detail": (
                        "A payment record already exists for this order."
                    )
                },
                status=400,
            )

        transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        if payment_method == "cod":
            # COD is not paid until the courier collects the money.
            payment = Payment.objects.create(
                order=order,
                amount=order.total_amount,
                payment_method="cod",
                transaction_id=transaction_id,
                status="pending",
            )

            order.payment_status = "pending"
            order.status = "pending"

        else:
            # IMPORTANT:
            # This is only a placeholder, NOT real card/UPI processing.
            # Do not treat a real online payment as successful until
            # a payment gateway confirms it on the backend.
            payment = Payment.objects.create(
                order=order,
                amount=order.total_amount,
                payment_method=payment_method,
                transaction_id=transaction_id,
                status="pending",
            )

            order.payment_status = "pending"
            order.status = "pending"

        order.save(
            update_fields=[
                "payment_status",
                "status",
                "updated_at",
            ]
        )

        serializer = PaymentSerializer(payment)

        return Response(
            {
                "payment": serializer.data,
                "order_id": order.id,
                "order_number": order.order_number,
                "order_status": order.status,
                "payment_status": order.payment_status,
                "message": (
                    "Cash on Delivery selected. Payment is pending."
                    if payment_method == "cod"
                    else "Payment initiated. Awaiting payment confirmation."
                ),
            },
            status=201,
        )
