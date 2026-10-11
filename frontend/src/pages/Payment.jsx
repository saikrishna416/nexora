import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;

  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async (event) => {
    event.preventDefault();

    if (!orderId) {
      setError("Order information is missing.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/payments/create/", {
        order: orderId,
        payment_method: method,
      });

      console.log("Payment response:", response.data);

      const result = response.data;

navigate(`/orders/${orderId}`, {
  state: {
    orderNumber: result.order_number || orderNumber,
    paymentStatus: result.payment_status,
    orderStatus: result.order_status,
    paymentMethod: method,
    message: result.message,
  },
});
    } catch (error) {
      console.error(
        "Payment error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.detail ||
        "Payment failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "50px 24px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "34px",
          marginBottom: "10px",
        }}
           >
        Payment
      </h1>

      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
          padding: "14px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <p style={{ margin: "0 0 5px", color: "#6b7280" }}>
          Order ID
        </p>

        <strong style={{ fontSize: "18px" }}>
          {orderNumber || (orderId ? `NXR-${orderId}` : "Unavailable")}
        </strong>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#6b7280",
          marginBottom: "35px",
        }}
      >
        Choose your preferred payment method.
      </p>

      <div
        style={{
          padding: "30px",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          backgroundColor: "#f9fafb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2
          style={{
            fontSize: "21px",
            marginBottom: "22px",
          }}
        >
          Select Payment Method
        </h2>

        <form onSubmit={handlePayment}>
          {/* UPI */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "18px",
              marginBottom: "12px",
              border: method === "upi"
                ? "2px solid #111827"
                : "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              value="upi"
              checked={method === "upi"}
              onChange={(event) =>
                setMethod(event.target.value)
              }
            />

            <div>
              <strong>UPI</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Pay using a UPI application
              </p>
            </div>
          </label>

          {/* Card */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "18px",
              marginBottom: "12px",
              border: method === "card"
                ? "2px solid #111827"
                : "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              value="card"
              checked={method === "card"}
              onChange={(event) =>
                setMethod(event.target.value)
              }
            />

            <div>
              <strong>Credit / Debit Card</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Pay securely using your card
              </p>
            </div>
          </label>

          {/* COD */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "18px",
              marginBottom: "25px",
              border: method === "cod"
                ? "2px solid #111827"
                : "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              value="cod"
              checked={method === "cod"}
              onChange={(event) =>
                setMethod(event.target.value)
              }
            />

            <div>
              <strong>Cash on Delivery</strong>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Pay when your order arrives
              </p>
            </div>
          </label>

          {error && (
            <p
              style={{
                color: "#dc2626",
                marginBottom: "15px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "7px",
              backgroundColor: loading
                ? "#9ca3af"
                : "#111827",
              color: "white",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            {loading
              ? "Processing Payment..."
              : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Payment;