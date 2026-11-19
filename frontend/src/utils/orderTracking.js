import { useEffect, useState } from "react";
import { formatPaymentMethod } from "./orderFormat";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseOrderDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date
    ? date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
}

function formatDateTime(date) {
  return date
    ? date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date unavailable";
}

function getElapsedBusinessDays(from, to) {
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let elapsed = 0;

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor <= end && cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      elapsed += 1;
    }
  }

  return elapsed;
}

export function getRefundTrackingState(order, now = new Date()) {
  const isCancelled = String(order?.status || "").trim().toLowerCase() === "cancelled";
  const paymentInfo = formatPaymentMethod(order);
  const paymentStatus = String(order?.payment_status || "pending").trim().toLowerCase();
  const cancellationDate = parseOrderDate(
    order?.cancelled_at ||
      order?.canceled_at ||
      order?.cancellation_date ||
      order?.updated_at ||
      order?.created_at
  );
  const normalizedNow = parseOrderDate(now) || new Date();
  const isPaidOnline =
    isCancelled &&
    !paymentInfo.isCod &&
    (paymentStatus === "paid" ||
      paymentStatus === "refunded" ||
      (Boolean(paymentInfo.paymentId) && paymentStatus !== "failed"));
  const elapsedBusinessDays = cancellationDate
    ? getElapsedBusinessDays(cancellationDate, normalizedNow)
    : 0;
  const expectedRefundDate = cancellationDate
    ? new Date(
        cancellationDate.getFullYear(),
        cancellationDate.getMonth(),
        cancellationDate.getDate() + 5
      )
    : null;
  const refunded =
    isPaidOnline &&
    (paymentStatus === "refunded" || elapsedBusinessDays >= 5);
  const amount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(order?.total_amount) || 0);

  let notice = "";
  if (isCancelled && paymentInfo.isCod) {
    notice =
      "Order cancelled. Since this was a Cash on Delivery (COD) order, no payment was charged and no refund is required.";
  } else if (isPaidOnline) {
    notice = refunded
      ? `Refund of ₹${amount} has been refunded to your original payment method (Razorpay).`
      : `Refund of ₹${amount} has been initiated to your original payment method (Razorpay). Your amount will be credited back to your account within 3–7 working days.`;
  } else if (isCancelled) {
    notice = "Order cancelled. No payment was captured, so no refund is required.";
  }

  return {
    isCancelled,
    isCod: paymentInfo.isCod,
    isPaidOnline,
    cancellationDate,
    cancellationDateLabel: formatDateTime(cancellationDate),
    orderPlacedDateLabel: formatDateTime(parseOrderDate(order?.created_at)),
    expectedRefundDate,
    expectedRefundDateLabel: formatDate(expectedRefundDate),
    elapsedBusinessDays,
    refunded,
    refundStatusLabel: refunded ? "Refunded" : "Refund Initiated",
    paymentStatusLabel: isPaidOnline
      ? refunded
        ? "Refunded"
        : "Refund Initiated"
      : "Cancelled · No Charge",
    paymentBadgeStatus: isPaidOnline
      ? refunded
        ? "refunded"
        : "refund-initiated"
      : "cancelled",
    listMessage: refunded
      ? "Cancelled · Refunded"
      : "Cancelled · Refund within 3–7 working days",
    notice,
  };
}

export function useOrderTrackingNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

export function getOrderTrackingState(order, now = new Date()) {
  const rawStatus = String(order?.status || "pending").trim().toLowerCase();
  const orderDate = parseOrderDate(order?.created_at);
  const serverDeliveryDate = parseOrderDate(
    order?.expected_delivery_date || order?.delivery_date
  );
  const expectedDeliveryDate = serverDeliveryDate
    ? serverDeliveryDate
    : orderDate
      ? new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate() + 4)
      : null;
  const expectedDeliveryStart = expectedDeliveryDate
    ? new Date(
        expectedDeliveryDate.getFullYear(),
        expectedDeliveryDate.getMonth(),
        expectedDeliveryDate.getDate()
      )
    : null;
  const normalizedNow = parseOrderDate(now) || new Date();
  const rawDeliveredDate = parseOrderDate(
    order?.delivered_at || order?.actual_delivery_date
  );

  let status;
  if (rawStatus === "cancelled") {
    status = "cancelled";
  } else if (
    rawStatus === "delivered" ||
    (expectedDeliveryStart && normalizedNow >= expectedDeliveryStart)
  ) {
    status = "delivered";
  } else if (
    orderDate && normalizedNow.getTime() >= orderDate.getTime() + 3 * DAY_MS
  ) {
    status = "out_for_delivery";
  } else if (
    rawStatus === "shipped" ||
    (orderDate && normalizedNow.getTime() >= orderDate.getTime() + 1.5 * DAY_MS)
  ) {
    status = "shipped";
  } else if (
    rawStatus === "confirmed" ||
    (orderDate && normalizedNow.getTime() >= orderDate.getTime() + 4 * 60 * 60 * 1000)
  ) {
    status = "confirmed";
  } else {
    status = "confirmed";
  }

  const deliveredDate = rawDeliveredDate || expectedDeliveryDate;
  const expectedDateLabel = formatDate(expectedDeliveryDate);
  const deliveryMessage =
    status === "cancelled"
      ? "Order Cancelled"
      : status === "delivered"
        ? `Delivered on ${formatDate(deliveredDate) || "today"}`
        : status === "out_for_delivery"
          ? `Expected Delivery: ${expectedDateLabel}`
          : `Expected Delivery by ${expectedDateLabel || "date to be confirmed"}`;
  const statusLabel = {
    pending: "Order Confirmed",
    confirmed: "Order Confirmed",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  }[status];
  const filterStatus =
    status === "out_for_delivery" ? "shipped" : status;
  const completedSteps = {
    pending: 1,
    confirmed: 1,
    shipped: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: 0,
  }[status];
  const paymentInfo = formatPaymentMethod({
    ...order,
    status: status === "delivered" ? "delivered" : rawStatus,
  });
  const tone =
    status === "delivered"
      ? "delivered"
      : status === "cancelled"
        ? "cancelled"
        : status === "confirmed"
          ? "confirmed"
          : "shipped";

  return {
    status,
    statusLabel,
    filterStatus,
    tone,
    orderDate,
    expectedDeliveryDate,
    expectedDeliveryDateLabel: expectedDateLabel,
    deliveryMessage,
    completedSteps,
    paymentInfo,
  };
}
