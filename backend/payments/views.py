
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

        existing_payment = Payment.objects.filter(order=order).first()

        if existing_payment:
            # Allow the existing payment to be reused for demo testing.
            existing_payment.payment_method = payment_method
            existing_payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

            if payment_method == "upi":
                existing_payment.status = "success"
                order.payment_status = "paid"
                order.status = "pending"

            elif payment_method == "cod":
                existing_payment.status = "pending"
                order.payment_status = "pending"
                order.status = "pending"

            else:
                existing_payment.status = "pending"
                order.payment_status = "pending"
                order.status = "pending"

            existing_payment.save()
            order.save(update_fields=["payment_status", "status", "updated_at"])

            return Response({
                "payment": PaymentSerializer(existing_payment).data,
                "order_id": order.id,
                "order_number": order.order_number,
                "order_status": order.status,
                "payment_status": order.payment_status,
                "message": (
                    "UPI payment successful (DEMO MODE)."
                    if payment_method == "upi"
                    else "Cash on Delivery selected. Payment is pending."
                    if payment_method == "cod"
                    else "Card payment is pending. Card processing is not integrated."
                ),
            }, status=200)

        
        transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        # DEMO ONLY: Online payment success is simulated.
        if payment_method in ["upi", "card"]:
            payment_status = "success"
            order_payment_status = "paid"
            message = (
                f"{payment_method.upper()} payment successful (DEMO MODE)."
            )
        else:
            payment_status = "pending"
            order_payment_status = "pending"
            message = "Cash on Delivery selected. Payment is pending."

        existing_payment = Payment.objects.filter(order=order).first()

        if existing_payment:
            existing_payment.payment_method = payment_method
            existing_payment.transaction_id = transaction_id
            existing_payment.status = payment_status
            existing_payment.amount = order.total_amount
            existing_payment.save()
            payment = existing_payment
        else:
            payment = Payment.objects.create(
                order=order,
                amount=order.total_amount,
                payment_method=payment_method,
                transaction_id=transaction_id,
                status=payment_status,
            )

        order.payment_status = order_payment_status
        order.status = "pending"
        order.save(
            update_fields=["payment_status", "status", "updated_at"]
        )

        return Response({
            "payment": PaymentSerializer(payment).data,
            "order_id": order.id,
            "order_number": order.order_number,
            "order_status": order.status,
            "payment_status": order.payment_status,
            "message": message,
        }, status=200 if existing_payment else 201)
