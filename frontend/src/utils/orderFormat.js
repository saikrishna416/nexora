const COD_METHODS = new Set(["cod", "cash on delivery"]);
const ONLINE_METHODS = new Set([
  "razorpay",
  "online",
  "online payment",
  "online card",
  "online upi",
  "card",
  "card payment",
  "credit card",
  "debit card",
  "upi",
  "upi payment",
  "card upi",
  "netbanking",
  "net banking",
]);

export function formatOrderId(orderOrId) {
  const isOrder = orderOrId !== null && typeof orderOrId === "object";
  const orderNumber = isOrder ? String(orderOrId.order_number || "").trim() : "";
  if (orderNumber) return orderNumber;

  const id = isOrder ? orderOrId.id : orderOrId;
  const digits = String(id ?? "").replace(/\D/g, "");
  return `ODNXR${digits.padStart(6, "0")}`;
}

export function formatPaymentMethod(order) {
  const method = String(
    order?.payment_method ||
      order?.payment?.payment_method ||
      order?.payment?.method ||
      order?.payment_type ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[/_-]+/g, " ")
    .replace(/\s+/g, " ");
  const paymentId =
    order?.razorpay_payment_id ||
    order?.payment_id ||
    order?.payment?.razorpay_payment_id ||
    order?.payment?.payment_id ||
    "";
  const isCodMethod =
    COD_METHODS.has(method) || method.startsWith("cash on delivery");
  const isOnline = ONLINE_METHODS.has(method) || Boolean(paymentId);
  const isCod = isCodMethod || !isOnline;
  const orderStatus = String(order?.status || "").toLowerCase();
  const paymentStatus = String(order?.payment_status || "pending").toLowerCase();

  let methodLabel = "Cash on Delivery (COD)";
  if (!isCod) {
    if (method === "upi" || method === "upi payment" || method === "online upi") {
      methodLabel = "UPI";
    } else if (method.includes("card") || method === "card upi") {
      methodLabel = "Card / UPI";
    } else {
      methodLabel = "Online Payment (Razorpay)";
    }
  }

  let paymentLabel;
  if (isCod) {
    paymentLabel =
      orderStatus === "delivered" || paymentStatus === "paid"
        ? "Paid"
        : "Pay on Delivery · Pending";
  } else {
    paymentLabel =
      paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1);
  }

  return { methodLabel, paymentLabel, paymentId, isCod };
}
