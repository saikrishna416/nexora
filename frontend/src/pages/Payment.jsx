import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const orderId = location.state?.orderId;
  const orderNumber = location.state?.orderNumber;

  const [method, setMethod] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [phone, setPhone] = useState("");

  const goToOrder = (result, paymentMethod) => {
    navigate(`/orders/${orderId}`, {
      state: {
        orderNumber: result.order_number || orderNumber,
        paymentStatus: result.payment_status,
        orderStatus: result.order_status,
        paymentMethod,
        message: result.message,
      },
    });
  };

  const handlePayment = async (event) => {
  event.preventDefault();
  if (loading) return;

  if (!orderId) {
    setError(
      "Order information is missing. Please return to checkout."
    );
    return;
  }

  if (method === "razorpay" && !/^[6-9]\d{9}$/.test(phone)) {
    setError("Please enter a valid 10-digit Indian mobile number.");
    return;
  }

  setError("");
  setNotice("");
  setLoading(true);

  try {
    // Cash on Delivery
    if (method === "cod") {
      const response = await api.post("/payments/create/", {
        order: orderId,
        payment_method: "cod",
      });

      setLoading(false);
      goToOrder(response.data, "cod");
      return;
    }

    // Load Razorpay Checkout
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error(
        "Unable to load Razorpay Checkout. Check your internet connection and try again."
      );
    }

  // Create Razorpay order through Django backend
      const response = await api.post("/payments/create/", {
        order: orderId,
        payment_method: "razorpay",
        phone: phone.trim(),
      });

      const checkout = response.data;

      if (!checkout.key_id || !checkout.razorpay_order_id) {
        throw new Error(
          "Razorpay is not configured correctly on the server."
        );
      }

      const options = {
        key: checkout.key_id,
        amount: checkout.amount,
        currency: checkout.currency || "INR",

        name: "Nexora",

        description: `Payment for ${
          checkout.order_number || orderNumber || "your order"
        }`,

        order_id: checkout.razorpay_order_id,
        customer_id: checkout.customer_id || undefined,

        prefill: {
          name: checkout.name || "",
          email: checkout.email || "",
          contact: `+91${phone.trim()}`,
        },

        readonly: {
          contact: true,
          email: Boolean(checkout.email),
        },
  
      notes: {
        nexora_order_id: String(orderId),
        nexora_order_number:
          checkout.order_number || orderNumber || "",
      },

      theme: {
        color: "#111827",
      },

      handler: async (razorpayResponse) => {
        try {
          const verification = await api.post(
            "/payments/verify/",
            {
              razorpay_order_id:
                razorpayResponse.razorpay_order_id,

              razorpay_payment_id:
                razorpayResponse.razorpay_payment_id,

              razorpay_signature:
                razorpayResponse.razorpay_signature,
            }
          );

          goToOrder(verification.data, "razorpay");
        } catch (verificationError) {
          console.error(
            "Razorpay verification error:",
            verificationError.response?.data ||
              verificationError
          );

          setError(
            verificationError.response?.data?.detail ||
              "Payment was submitted, but verification is not complete. Please check your order before retrying."
          );
        } finally {
          setLoading(false);
        }
      },

      modal: {
        ondismiss: () => {
          setLoading(false);
          setError("");
          setNotice(
            "Payment cancelled. Your items are still in your cart."
          );
        },
        escape: true,
        confirm_close: true,
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", (failure) => {
      console.error(
        "Razorpay payment failed:",
        failure.error
      );

      setError(
        failure.error?.description ||
          "Payment could not be completed. You can retry or choose Cash on Delivery."
      );
      setNotice("Your items are still in your cart.");

      setLoading(false);
    });

    razorpay.open();
  } catch (paymentError) {
    console.error(
      "Payment error:",
      paymentError.response?.data || paymentError
    );

    setError(
      paymentError.response?.data?.detail ||
        paymentError.message ||
        "Unable to start payment. Please try again."
    );

    setLoading(false);
  }
};
  const optionStyle = (selected) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "18px",
    marginBottom: "12px",
    border: selected
      ? "2px solid #111827"
      : "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
  });

  return (
    <main
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
        <p
          style={{
            margin: "0 0 5px",
            color: "#6b7280",
          }}
        >
          Order ID
        </p>

        <strong style={{ fontSize: "18px" }}>
          {orderNumber ||
            (orderId ? `NXR-${orderId}` : "Unavailable")}
        </strong>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#6b7280",
          marginBottom: "35px",
        }}
      >
        Choose how you would like to pay for your order.
      </p>

      <section
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
          {method === "razorpay" && (
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="payment-phone"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Mobile Number
              </label>

              <input
                id="payment-phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="Enter your 10-digit mobile number"
                maxLength={10}
                required
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "7px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />

              <small style={{ color: "#6b7280" }}>
                Enter the mobile number you want to use for this payment.
              </small>
            </div>
          )}
          <label style={optionStyle(method === "razorpay")}>
            <input
              type="radio"
              name="payment-method"
              value="razorpay"
              checked={method === "razorpay"}
              onChange={(event) =>
                setMethod(event.target.value)
              }
            />

            <div>
              <strong>Pay Online with Razorpay</strong>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                UPI, credit/debit cards, netbanking and
                supported wallets
              </p>

              <span
                style={{
                  display: "inline-block",
                  marginTop: "7px",
                  color: "#047857",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                TEST MODE — no real money is charged
              </span>
            </div>
          </label>

          <label style={optionStyle(method === "cod")}>
            <input
              type="radio"
              name="payment-method"
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
              role="alert"
              style={{
                color: "#dc2626",
                marginBottom: "15px",
              }}
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              aria-live="polite"
              style={{
                color: "#047857",
                marginBottom: "15px",
                padding: "10px 12px",
                backgroundColor: "#ecfdf5",
                borderRadius: "7px",
              }}
            >
              {notice}
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
              ? "Please wait..."
              : method === "cod"
              ? "Confirm Cash on Delivery"
              : "Continue to Razorpay"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Link to="/cart" style={{ color: "#374151", fontWeight: 600 }}>
            Return to cart
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Payment;