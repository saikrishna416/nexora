
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function OrderDetails() {
  const { id } = useParams();
  useEffect(() => {
  window.scrollTo(0, 0);
}, [id]);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}/`);

        if (!cancelled) {
          setOrder(response.data.order || response.data);
        }
      } catch (err) {
        console.error(
          "Load order error:",
          err.response?.data || err.message
        );

        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "Failed to load order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [id]);



const handleCancelOrder = async () => {
  if (!order || cancelling || !cancellationReason) return;

  setError("");
  setCancelMessage("");
  setCancelling(true);

  try {
    const response = await api.patch(`/orders/${id}/cancel/`, {
      reason: cancellationReason,
    });

    // Fetch the latest complete order, including product images.
   const refreshedResponse = await api.get(`/orders/${id}/`);
const refreshedOrder =
  refreshedResponse.data.order || refreshedResponse.data;

setOrder(refreshedOrder);
setShowCancelModal(false);
setCancelMessage(
  response.data.message || "Your order has been cancelled."
);

// Scroll to the top after cancellation
window.scrollTo({
  top: 0,
  left: 0,
  behavior: "auto",
});
  } catch (err) {
    console.error(
      "Cancel order error:",
      err.response?.data || err.message
    );

    setError(
      err.response?.data?.detail ||
        "Order was cancelled, but refreshing its details failed. Please refresh the page."
    );
  } finally {
    setCancelling(false);
  }
};



  if (loading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        Loading order...
      </h2>
    );
  }

  if (error && !order) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>{error}</h2>
        <Link to="/orders">Back to Orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        Order not found.
      </h2>
    );
  }

 const canCancel = ["pending", "confirmed"].includes(
  String(order.status || "").toLowerCase()
);

  const orderNumber =
  order.order_number ||
  (order.id ? `Order #${order.id}` : "Order Details");
  
  const estimatedDelivery = (() => {
  if (!order.created_at) return null;

  const date = new Date(order.created_at);

  // Estimated delivery: 5–7 days after the order date
  date.setDate(date.getDate() + 6);

  return date;
})();

  const formattedDeliveryDate = estimatedDelivery
    ? estimatedDelivery.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Will be updated soon";

  const paymentStatus =
    String(order.payment_status || "pending").toLowerCase();

  const orderStatus =
    String(order.status || "pending").toLowerCase();

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "45px 24px",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <div>
          <p style={{ color: "#6b7280", marginBottom: "6px" }}>
            Order Details
          </p>

          <h1 style={{ margin: 0, fontSize: "34px" }}>
            {orderNumber}
          </h1>

          <p style={{ color: "#6b7280", marginBottom: 0 }}>
            Order placed:{" "}
            {order.created_at
              ? new Date(order.created_at).toLocaleString()
              : "Date unavailable"}
          </p>
        </div>

       <Link
  to="/orders"
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 20px",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #0f766e",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 5px rgba(15, 118, 110, 0.15)",
  }}
>
  Back to Orders
</Link>
      </header>

      {/* Feedback */}
      {cancelMessage && (
        <p
          role="status"
          style={{
            padding: "12px 16px",
            backgroundColor: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {cancelMessage}
        </p>
      )}

      {error && (
        <p
          role="alert"
          style={{
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </p>
      )}

      {/* Order Summary */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
          padding: "25px",
          marginBottom: "25px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          backgroundColor: "#f9fafb",
        }}
      >
        <div>
          <p style={{ margin: "0 0 7px", color: "#6b7280" }}>
            Order ID
          </p>
          <strong style={{ fontSize: "18px", overflowWrap: "anywhere" }}>
            {orderNumber}
          </strong>
        </div>

        <div>
          <p style={{ margin: "0 0 7px", color: "#6b7280" }}>
            Total Amount
          </p>
          <strong style={{ fontSize: "24px" }}>
            ₹{Number(order.total_amount || 0).toFixed(2)}
          </strong>
        </div>

        <div>
          <p style={{ margin: "0 0 7px", color: "#6b7280" }}>
            Order Status
          </p>
          <span
            style={{
              display: "inline-block",
              padding: "7px 13px",
              borderRadius: "20px",
              backgroundColor:
                orderStatus === "delivered"
                  ? "#dcfce7"
                  : orderStatus === "cancelled"
                  ? "#fee2e2"
                  : "#f3f4f6",
              color:
                orderStatus === "delivered"
                  ? "#166534"
                  : orderStatus === "cancelled"
                  ? "#991b1b"
                  : "#374151",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {["pending", "confirmed"].includes(orderStatus)
  ? "Order Placed"
  : orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
          </span>
        </div>

        <div>
          <p style={{ margin: "0 0 7px", color: "#6b7280" }}>
            Payment Status
          </p>
          <span
            style={{
              display: "inline-block",
              padding: "7px 13px",
              borderRadius: "20px",
              backgroundColor:
                paymentStatus === "paid"
                  ? "#dcfce7"
                  : paymentStatus === "failed"
                  ? "#fee2e2"
                  : "#fef3c7",
              color:
                paymentStatus === "paid"
                  ? "#166534"
                  : paymentStatus === "failed"
                  ? "#991b1b"
                  : "#92400e",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {paymentStatus}
          </span>

          {paymentStatus === "pending" && (
            <p
              style={{
                fontSize: "12px",
                color: "#92400e",
                marginBottom: 0,
              }}
            >
              Payment has not been confirmed.
            </p>
          )}
        </div>
      </section>

      {/* Estimated Delivery */}
<section
  style={{
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "22px 25px",
    marginBottom: "25px",
    border: "1px solid #99f6e4",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #f0fdfa, #ffffff)",
  }}
>
  <div
    style={{
      width: "52px",
      height: "52px",
      minWidth: "52px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "12px",
      backgroundColor: "#ccfbf1",
      fontSize: "26px",
    }}
  >
    🚚
  </div>

  <div>
    <p
      style={{
        margin: "0 0 5px",
        color: "#0f766e",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      Estimated Delivery
    </p>

    <h3
      style={{
        margin: "0 0 5px",
        color: "#111827",
        fontSize: "20px",
      }}
    >
      {orderStatus === "cancelled"
        ? "Order Cancelled"
        : orderStatus === "delivered"
          ? "Delivered"
          : formattedDeliveryDate}
    </h3>

    <p
      style={{
        margin: 0,
        color: "#6b7280",
        fontSize: "13px",
      }}
    >
      {orderStatus === "cancelled"
        ? "This order will not be delivered."
        : orderStatus === "delivered"
          ? "Your order has been delivered."
          : "Estimated 5–7 days after placing your order."}
    </p>
  </div>
</section>

      {/* Shipping Address */}
      <section
        style={{
          padding: "25px",
          marginBottom: "25px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ fontSize: "21px", marginBottom: "15px" }}>
          Shipping Address
        </h2>

        <p
          style={{
            margin: 0,
            color: "#4b5563",
            lineHeight: "1.6",
            whiteSpace: "pre-line",
          }}
        >
          {order.shipping_address || "No shipping address available."}
        </p>
      </section>

      {/* Order Items */}
      <section
        style={{
          padding: "25px",
          marginBottom: "25px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ fontSize: "21px", marginBottom: "20px" }}>
          Order Items
        </h2>

        {order.items?.length ? (
  order.items.map((item) => (
    <div
      key={item.id}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
        padding: "18px 0",
        borderBottom: "1px solid #e5e7eb",
        flexWrap: "wrap",
      }}
    >
      {/* Product image and information */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flex: "1",
          minWidth: "220px",
        }}
      >
        <img
          src={
            item.product_image ||
            item.image ||
            item.product?.image ||
            "/placeholder.png"
          }
          alt={item.product_name || "Product"}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/placeholder.png";
          }}
          style={{
            width: "100px",
            height: "100px",
            objectFit: "contain",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            padding: "6px",
          }}
        />

        <div>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "17px",
              color: "#111827",
            }}
          >
            {item.product_name}
          </h3>

          <p style={{ margin: 0, color: "#6b7280" }}>
            ₹{Number(item.price || 0).toFixed(2)} ×{" "}
            {item.quantity}
          </p>
        </div>
      </div>

      {/* Item subtotal */}
      <strong style={{ fontSize: "17px", color: "#111827" }}>
        ₹{Number(item.subtotal || 0).toFixed(2)}
      </strong>
    </div>
  ))
) : (
  <p>No order items were returned.</p>
)}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "20px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          <span>Total</span>
          <span>
            ₹{Number(order.total_amount || 0).toFixed(2)}
          </span>
        </div>
      </section>

      {/* Cancel Order */}
      {canCancel && (
        <section
          style={{
            padding: "20px",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            backgroundColor: "#fff7f7",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Need to cancel this order?
          </h3>

          <p style={{ color: "#6b7280" }}>
You can cancel this order while it is pending or confirmed.
          </p>

          <button
            type="button"
            onClick={() => {
              setCancellationReason("");
              setShowCancelModal(true);
            }}
            disabled={cancelling}
            style={{
              padding: "11px 20px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Cancel Order
          </button>
        </section>
      )}

      
{/* Custom Cancel Order Modal */}
{showCancelModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 9999,
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
      style={{
        width: "100%",
        maxWidth: "460px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}
    >
      <h2
        id="cancel-order-title"
        style={{ marginTop: 0, color: "#111827" }}
      >
        Cancel this order?
      </h2>

      <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
        Are you sure you want to cancel{" "}
        <strong>{order.order_number || `Order #${order.id}`}</strong>?
        Please select a reason.
      </p>

      <label
        htmlFor="cancel-reason"
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "8px",
          color: "#374151",
        }}
      >
        Reason for cancellation
      </label>

      <select
        id="cancel-reason"
        value={cancellationReason}
        onChange={(event) =>
          setCancellationReason(event.target.value)
        }
        style={{
          width: "100%",
          padding: "12px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          marginBottom: "24px",
          backgroundColor: "#ffffff",
          fontSize: "14px",
        }}
      >
        <option value="">Choose a reason</option>
        <option value="ordered_by_mistake">Ordered by mistake</option>
        <option value="found_better_price">Found a better price</option>
        <option value="delivery_too_late">Delivery is taking too long</option>
        <option value="wrong_product">Ordered the wrong product</option>
        <option value="payment_issue">Payment issue</option>
        <option value="changed_mind">Changed my mind</option>
        <option value="other">Other reason</option>
      </select>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setShowCancelModal(false)}
          disabled={cancelling}
          style={{
            padding: "11px 18px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            color: "#374151",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          No, Keep Order
        </button>

        <button
          type="button"
          onClick={handleCancelOrder}
          disabled={cancelling || !cancellationReason}
          style={{
            padding: "11px 18px",
            border: "none",
            borderRadius: "8px",
            backgroundColor:
              cancelling || !cancellationReason
                ? "#fca5a5"
                : "#dc2626",
            color: "#ffffff",
            cursor:
              cancelling || !cancellationReason
                ? "not-allowed"
                : "pointer",
            fontWeight: "600",
          }}
        >
          {cancelling ? "Cancelling..." : "Yes, Cancel Order"}
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );

}
export default OrderDetails;
