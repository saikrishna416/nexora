import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const GUEST_CART_KEY = "nexora_guest_cart";

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  const buildGuestCart = (items) => {
    const normalized = items.map((item) => ({
      ...item,
      subtotal: Number(item.product_price || 0) * Number(item.quantity || 1),
    }));
    return {
      items: normalized,
      total: normalized.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    };
  };

  const refreshCart = async () => {
    if (!isLoggedIn) {
      const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
      setCart(buildGuestCart(guestItems));
      return;
    }

    const response = await api.get("/cart/");
    setCart(response.data);
  };

  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      try {
        if (!localStorage.getItem("access_token")) {
          const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
          if (!cancelled) setCart(buildGuestCart(guestItems));
        } else {
          const response = await api.get("/cart/");
          if (!cancelled) setCart(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load cart:", err.response?.data || err);
          setError("Failed to load cart. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCart();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      if (!localStorage.getItem("access_token")) {
        const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
        const updated = guestItems.map((entry) =>
          String(entry.id) === String(item.id)
            ? { ...entry, quantity: Math.min(newQuantity, Number(entry.stock || 99)) }
            : entry
        );
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
        setCart(buildGuestCart(updated));
      } else {
        await api.patch(`/cart/items/${item.id}/`, { quantity: newQuantity });
        await refreshCart();
      }
      setError("");
    } catch (err) {
      console.error("Quantity update error:", err.response?.data || err);
      setError("Failed to update quantity.");
    }
  };

  const removeItem = async (item) => {
    try {
      if (!localStorage.getItem("access_token")) {
        const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
        const updated = guestItems.filter(
          (entry) => String(entry.id) !== String(item.id)
        );
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
        setCart(buildGuestCart(updated));
      } else {
        await api.delete(`/cart/items/${item.id}/remove/`);
        await refreshCart();
      }
      setError("");
    } catch (err) {
      console.error("Remove item error:", err.response?.data || err);
      setError("Failed to remove item.");
    }
  };

  const getImageUrl = (image) => {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    return `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  if (loading) {
    return <h2 style={{ textAlign: "center", marginTop: "50px" }}>Loading cart...</h2>;
  }

  if (error && !cart.items.length) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>;
  }

  if (!cart.items.length) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h1>Your Cart is Empty</h1>
        <p style={{ color: "#6b7280", margin: "15px 0 25px" }}>
          Looks like you haven't added anything to your cart yet.
        </p>
        <button onClick={() => navigate("/products")} style={primaryButton}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="nx-cart-page">
      <h1 style={{ fontSize: "34px", marginBottom: "30px" }}>Your Cart</h1>
      {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
      {!isLoggedIn && (
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Your items are saved in this browser. Sign in to sync your cart with your account.
        </p>
      )}
      <div className="nx-cart-layout">
        <div>
          {cart.items.map((item) => (
            <div key={item.id} className="nx-cart-item">
              <div className="nx-cart-item-image">
                {item.product_image ? (
                  <img src={getImageUrl(item.product_image)} alt={item.product_name} />
                ) : <span style={{ color: "#6b7280" }}>No Image</span>}
              </div>
              <div className="nx-cart-item-info">
                <h2 style={{ margin: "0 0 10px", fontSize: "21px" }}>{item.product_name}</h2>
                {item.selected_size && <p>Size: {item.selected_size}</p>}
                <p style={{ margin: "0 0 12px", color: "#6b7280" }}>Price: ₹{item.product_price}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                  <button onClick={() => updateQuantity(item, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                  <span style={{ minWidth: "25px", textAlign: "center", fontWeight: "600" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item, item.quantity + 1)} disabled={!isLoggedIn && item.quantity >= Number(item.stock || 99)}>+</button>
                </div>
                <p style={{ fontWeight: "600", marginBottom: "12px" }}>Subtotal: ₹{item.subtotal ?? Number(item.product_price) * Number(item.quantity)}</p>
                <button onClick={() => removeItem(item)} style={{ border: "none", background: "none", padding: 0, color: "#dc2626", cursor: "pointer", fontWeight: "600" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div className="nx-cart-summary">
          <h2 style={{ marginBottom: "25px", fontSize: "22px" }}>Order Summary</h2>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <span>Items</span><span>{cart.items.reduce((sum, item) => sum + Number(item.quantity), 0)}</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "18px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", marginBottom: "25px" }}>
            <span>Total</span><span>₹{cart.total}</span>
          </div>
          <button onClick={() => navigate(isLoggedIn ? "/checkout" : "/login")} style={{ ...primaryButton, width: "100%" }}>
            {isLoggedIn ? "Proceed to Checkout" : "Sign in to Checkout"}
          </button>
          <button onClick={() => navigate("/products")} style={{ width: "100%", padding: "12px", marginTop: "10px", border: "1px solid #d1d5db", borderRadius: "7px", backgroundColor: "white", color: "#111827", cursor: "pointer", fontSize: "14px" }}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

const primaryButton = {
  padding: "12px 24px",
  border: "none",
  borderRadius: "7px",
  backgroundColor: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
};

export default Cart;
