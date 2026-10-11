import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/orders/")
      .then((response) => {
        setOrders(response.data.results || response.data);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to load orders.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        Loading orders...
      </h2>
    );
  }

  if (error) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        {error}
      </h2>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
        }}
      >
        <h1>No Orders Yet</h1>

        <p
          style={{
            color: "#6b7280",
            margin: "15px 0 25px",
          }}
        >
          You haven't placed any orders yet.
        </p>

        <Link
          to="/products"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#111827",
            color: "white",
            textDecoration: "none",
            borderRadius: "7px",
            fontWeight: "600",
          }}
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "45px 24px",
      }}
    >
      <h1
        style={{
          fontSize: "34px",
          marginBottom: "30px",
        }}
      >
        My Orders
      </h1>
      

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            marginBottom: "20px",
            padding: "25px",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            backgroundColor: "white",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
          }}
        >

          {/* Ordered Products */}
<div
  style={{
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "22px",
    paddingBottom: "18px",
    borderBottom: "1px solid #e5e7eb",
  }}
>
  {order.items?.length > 0 ? (
    order.items.map((item) => (
      <div
        key={item.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          backgroundColor: "#f9fafb",
          flex: "1 1 220px",
          minWidth: 0,
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
            width: "75px",
            height: "75px",
            objectFit: "contain",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            padding: "4px",
            flexShrink: 0,
          }}
        />

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 6px",
              fontWeight: "600",
              color: "#111827",
              overflowWrap: "anywhere",
            }}
          >
            {item.product_name}
          </p>

          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Qty: {item.quantity}
          </p>
        </div>
      </div>
    ))
  ) : (
    <p style={{ color: "#6b7280" }}>No product items available.</p>
  )}
</div>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <h2
            style={{
              margin: 0,
              fontSize: "21px",
              color: "#111827",
              overflowWrap: "anywhere",
            }}
          >
            Order ID: {order.order_number || `NXR-${order.id}`}
          </h2>

            <Link
  to={`/orders/${order.id}`}
  style={{
    display: "inline-block",
    padding: "10px 18px",
    backgroundColor: "#0f766e",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
    borderRadius: "8px",
    border: "1px solid #0f766e",
    transition: "background-color 0.2s ease",
    whiteSpace: "nowrap",
  }}
>
  View Details
</Link>
          </div>

          {/* Order information */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Total Amount
              </p>

              <strong style={{ fontSize: "20px" }}>
                ₹{order.total_amount}
              </strong>
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Order Status
              </p>

              <span
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor:
                    order.status === "delivered"
                      ? "#dcfce7"
                      : order.status === "cancelled"
                      ? "#fee2e2"
                      : "#f3f4f6",
                  color:
                    order.status === "delivered"
                      ? "#166534"
                      : order.status === "cancelled"
                      ? "#991b1b"
                      : "#374151",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {order.status}
              </span>
            </div>

            <div>
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Payment
              </p>

              <span
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  backgroundColor:
                    order.payment_status === "paid"
                      ? "#dcfce7"
                      : order.payment_status === "failed"
                      ? "#fee2e2"
                      : "#fef3c7",
                  color:
                    order.payment_status === "paid"
                      ? "#166534"
                      : order.payment_status === "failed"
                      ? "#991b1b"
                      : "#92400e",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {order.payment_status}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div
            style={{
              paddingTop: "18px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <p
              style={{
                margin: "0 0 5px",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Shipping Address
            </p>

            <p
              style={{
                margin: 0,
                color: "#374151",
                lineHeight: "1.5",
              }}
            >
              {order.shipping_address}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Orders;