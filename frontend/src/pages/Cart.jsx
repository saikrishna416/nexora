import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }

    try {
      await api.patch(`/cart/items/${itemId}/`, {
        quantity: newQuantity,
      });

      const response = await api.get("/cart/");
      setCart(response.data);
    } catch (error) {
      console.error(
        "Quantity update error:",
        error.response?.data || error
      );
      setError("Failed to update quantity.");
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}/remove/`);

      const response = await api.get("/cart/");
      setCart(response.data);
    } catch (error) {
      console.error(
        "Remove item error:",
        error.response?.data || error
      );
      setError("Failed to remove item.");
    }
  };

  useEffect(() => {
    api
      .get("/cart/")
      .then((response) => {
        setCart(response.data);
      })
      .catch((error) => {
        console.error(error);
        setError("Failed to load cart.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        Loading cart...
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

  if (!cart || cart.items.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
        }}
      >
        <h1>Your Cart is Empty</h1>

        <p style={{ color: "#6b7280", margin: "15px 0 25px" }}>
          Looks like you haven't added anything to your cart yet.
        </p>

        <button
          onClick={() => navigate("/products")}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: "7px",
            backgroundColor: "#111827",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
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
        Your Cart
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "30px",
          alignItems: "start",
        }}
      >
        {/* Cart Items */}
        <div>
          {cart.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "20px",
                padding: "20px",
                marginBottom: "18px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                backgroundColor: "white",
              }}
            >
              {/* Product Image */}
              <div
                style={{
                  width: "130px",
                  height: "130px",
                  flexShrink: 0,
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.product_image ? (
                  <img
                    src={`http://127.0.0.1:8000${item.product_image}`}
                    alt={item.product_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ color: "#6b7280" }}>
                    No Image
                  </span>
                )}
              </div>

              {/* Product Information */}
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "21px",
                  }}
                >
                  {item.product_name}
                </h2>

                <p
                  style={{
                    margin: "0 0 12px",
                    color: "#6b7280",
                  }}
                >
                  Price: ₹{item.product_price}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.quantity - 1
                      )
                    }
                    disabled={item.quantity <= 1}
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid #d1d5db",
                      borderRadius: "5px",
                      backgroundColor: "white",
                      cursor:
                        item.quantity <= 1
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    -
                  </button>

                  <span
                    style={{
                      minWidth: "25px",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.id,
                        item.quantity + 1
                      )
                    }
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid #d1d5db",
                      borderRadius: "5px",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>

                <p
                  style={{
                    fontWeight: "600",
                    marginBottom: "12px",
                  }}
                >
                  Subtotal: ₹{item.subtotal}
                </p>

                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    color: "#dc2626",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div
          style={{
            padding: "25px",
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
            position: "sticky",
            top: "20px",
          }}
        >
          <h2
            style={{
              marginBottom: "25px",
              fontSize: "22px",
            }}
          >
            Order Summary
          </h2>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "15px",
            }}
          >
            <span>Items</span>
            <span>{cart.items.length}</span>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e5e7eb",
              margin: "18px 0",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "25px",
            }}
          >
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "7px",
              backgroundColor: "#111827",
              color: "white",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            Proceed to Checkout
          </button>

          <button
            onClick={() => navigate("/products")}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              backgroundColor: "white",
              color: "#111827",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;