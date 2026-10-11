
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowProduct =
  location.state?.buyNowProduct ||
  location.state?.product ||
  null;


 const [shippingAddress, setShippingAddress] = useState(() => {
  const address =
    location.state?.selectedAddress ||
    location.state?.shippingAddress ||
    localStorage.getItem("shipping_address") ||
    "";

  return typeof address === "string"
    ? address
    : address?.address || "";
});

  const [editingAddress, setEditingAddress] = useState(
    !localStorage.getItem("shipping_address")
  );
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 

useEffect(() => {
  let cancelled = false;

  const fetchCart = async () => {
    if (buyNowProduct) {
      setLoadingCart(false);
      return;
    }

    try {
      const response = await api.get("/cart/");

      if (cancelled) return;

      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : data.items || data.cart_items || [];

      setCartItems(items);
    } catch (err) {
      if (!cancelled) {
        console.error(
          "Could not load cart:",
          err.response?.data || err.message
        );
        setError("Could not load your cart. Please try again.");
      }
    } finally {
      if (!cancelled) {
        setLoadingCart(false);
      }
    }
  };

  fetchCart();

  return () => {
    cancelled = true;
  };
}, [buyNowProduct]);



 
const products = useMemo(() => {
  if (buyNowProduct) {
    const product = buyNowProduct.product || buyNowProduct;

    return [{
      id: product.id || buyNowProduct.product_id,
      name: product.name || product.product_name || product.title || "Product",
      image: product.image || product.image_url || "",
      price: Number(product.price ?? buyNowProduct.price ?? 0),
      quantity: Number(buyNowProduct.quantity || 1),
    }];
  }

  return cartItems.map((item) => {
    const product =
      item.product_details ||
      (typeof item.product === "object" ? item.product : null) ||
      item;

    return {
      id: product.id || item.product_id || item.product,
      name: product.name || product.product_name || product.title || "Product",
      image: product.image || product.image_url || "",
      price: Number(product.price ?? item.unit_price ?? item.price ?? 0),
      quantity: Number(item.quantity || 1),
    };
  });
}, [buyNowProduct, cartItems]);


  const subtotal = products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const handleCheckout = async (event) => {
    event.preventDefault();
    setError("");

    if (!shippingAddress.trim()) {
      setError("Please enter your shipping address.");
      return;
    }

    if (products.length === 0) {
      setError("Your cart is empty. Please add a product first.");
      return;
    }

    setLoading(true);

    try {
      const response = buyNowProduct
        ? await api.post("/orders/buy-now/", {
            product: buyNowProduct.id,
            quantity: buyNowProduct.quantity || 1,
            shipping_address: shippingAddress.trim(),
          })
        : await api.post("/orders/create/", {
            shipping_address: shippingAddress.trim(),
          });

      localStorage.setItem(
        "shipping_address",
        shippingAddress.trim()
      );

      navigate("/payment", {
  state: {
    orderId: response.data.id,
    orderNumber: response.data.order_number,
  },
});
    } catch (err) {
      console.error(
        "Checkout error:",
        err.response?.data || err.message
      );

      const data = err.response?.data;
      setError(
        data?.detail ||
        data?.message ||
        (typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "") ||
        "Failed to create order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    return `http://127.0.0.1:8000${image.startsWith("/") ? "" : "/"}${image}`;
  };

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <header className="checkout-header">
          <p className="checkout-eyebrow">NEXORA CHECKOUT</p>
          <h1>Complete your order</h1>
          <p>Review your items and confirm your delivery address.</p>
        </header>
{loadingCart ? (
  <div className="checkout-loading">Loading your order...</div>
        ) : (
          <form onSubmit={handleCheckout} className="checkout-layout">
            <div className="checkout-main">
              <section className="checkout-card">
                <div className="checkout-section-heading">
                  <span className="checkout-step">1</span>
                  <div>
                    <h2>Delivery address</h2>
                    <p>Where should we deliver your order?</p>
                  </div>
                </div>

                {!editingAddress && shippingAddress ? (
                  <div className="saved-address">
                    <div>
                      <span className="saved-label">SAVED ADDRESS</span>
                      <p>{shippingAddress}</p>
                    </div>
                    <button
                      type="button"
                      className="checkout-text-button"
                      onClick={() => setEditingAddress(true)}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <>
                    <label htmlFor="shipping-address">
                      Complete shipping address
                    </label>
                    <textarea
                      id="shipping-address"
                      value={shippingAddress}
                      onChange={(event) =>
                        setShippingAddress(event.target.value)
                      }
                      placeholder="House/Flat No., Street, City, State, PIN Code"
                      rows={5}
                      required
                    />
                    <div className="address-actions">
                      {localStorage.getItem("shipping_address") && (
                        <button
                          type="button"
                          className="checkout-text-button"
                          onClick={() => {
                            setShippingAddress(
                              localStorage.getItem("shipping_address") || ""
                            );
                            setEditingAddress(false);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                )}
              </section>

              <section className="checkout-card">
                <div className="checkout-section-heading">
                  <span className="checkout-step">2</span>
                  <div>
                    <h2>Order items</h2>
                    <p>{products.length} product(s) in your order</p>
                  </div>
                </div>

                {products.length === 0 ? (
                  <p className="checkout-empty">
                    Your cart is empty.
                  </p>
                ) : (
                  <div className="checkout-items">
                    {products.map((item, index) => (
                      <div
                        className="checkout-item"
                        key={item.id || index}
                      >
                        <div className="checkout-product-image">
                          {item.image ? (
                            <img
                              src={imageUrl(item.image)}
                              alt={item.name}
                            />
                          ) : (
                            <span>No image</span>
                          )}
                        </div>

                        <div className="checkout-product-info">
                          <h3>{item.name}</h3>
                          <p>Quantity: {item.quantity}</p>

                          {buyNowProduct?.selected_size && (
                            <p>Size: {buyNowProduct.selected_size}</p>
                          )}
                          <span className="checkout-unit-price">
                            {formatPrice(item.price)} each
                          </span>
                        </div>

                        <strong className="checkout-line-total">
                          {formatPrice(item.price * item.quantity)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="checkout-summary">
              <h2>Price details</h2>

              <div className="checkout-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="checkout-summary-row">
                <span>Shipping</span>
                <span className="checkout-free">FREE</span>
              </div>

              <div className="checkout-summary-row">
                <span>Discount</span>
                <span>{formatPrice(0)}</span>
              </div>

              <div className="checkout-total-row">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <p className="checkout-secure-note">
                Your order total will be confirmed by the server.
              </p>

              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="checkout-submit"
                disabled={loading || loadingCart || products.length === 0}
              >
                {loading ? "Creating order..." : "Continue to payment"}
              </button>

              <p className="checkout-footer-note">
                Shipping and final charges are subject to your order details.
              </p>
            </aside>
          </form>
        )}
      </div>

      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 42px 20px 70px;
          color: #172033;
        }

        .checkout-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .checkout-header {
          margin-bottom: 32px;
        }

        .checkout-eyebrow {
          color: #0f9b8e;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .checkout-header h1 {
          margin: 0 0 10px;
          font-size: clamp(28px, 4vw, 38px);
          letter-spacing: -1px;
        }

        .checkout-header > p:last-child {
          color: #64748b;
          margin: 0;
        }

        .checkout-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          align-items: start;
          gap: 24px;
        }

        .checkout-main {
          display: grid;
          gap: 20px;
        }

        .checkout-card,
        .checkout-summary {
          background: #fff;
          border: 1px solid #e5eaf1;
          border-radius: 16px;
          padding: 26px;
          box-shadow: 0 5px 20px rgba(15, 23, 42, 0.035);
        }

        .checkout-section-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 24px;
        }

        .checkout-step {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #e6f7f4;
          color: #087f73;
          font-weight: 800;
        }

        .checkout-section-heading h2,
        .checkout-summary h2 {
          margin: 0 0 5px;
          font-size: 19px;
        }

        .checkout-section-heading p {
          margin: 0;
          color: #718096;
          font-size: 13px;
        }

        .checkout-card label {
          display: block;
          margin-bottom: 9px;
          font-weight: 650;
          font-size: 14px;
        }

        .checkout-card textarea {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          border: 1px solid #cfd8e3;
          border-radius: 9px;
          font: inherit;
          line-height: 1.6;
          resize: vertical;
          outline: none;
        }

        .checkout-card textarea:focus {
          border-color: #0f9b8e;
          box-shadow: 0 0 0 3px rgba(15, 155, 142, 0.12);
        }

        .saved-address {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 17px;
          border: 1px solid #d5eee9;
          border-radius: 10px;
          background: #f4fbf9;
        }

        .saved-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #087f73;
        }

        .saved-address p {
          margin: 9px 0 0;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .checkout-text-button {
          border: 0;
          background: transparent;
          color: #087f73;
          font-weight: 750;
          cursor: pointer;
          padding: 5px;
        }

        .checkout-items {
          display: grid;
        }

        .checkout-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid #edf0f5;
        }

        .checkout-item:first-child {
          padding-top: 0;
        }

        .checkout-item:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .checkout-product-image {
          width: 84px;
          height: 84px;
          flex: 0 0 84px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 10px;
          background: #f3f5f8;
          color: #94a3b8;
          font-size: 11px;
        }

        .checkout-product-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .checkout-product-info {
          flex: 1;
          min-width: 0;
        }

        .checkout-product-info h3 {
          margin: 0 0 7px;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .checkout-product-info p {
          margin: 0 0 7px;
          color: #64748b;
          font-size: 13px;
        }

        .checkout-unit-price {
          color: #64748b;
          font-size: 12px;
        }

        .checkout-line-total {
          white-space: nowrap;
          font-size: 14px;
        }

        .checkout-summary {
          position: sticky;
          top: 20px;
        }

        .checkout-summary h2 {
          margin-bottom: 24px;
        }

        .checkout-summary-row,
        .checkout-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 17px 0;
          font-size: 14px;
        }

        .checkout-summary-row span:first-child {
          color: #64748b;
        }

        .checkout-free {
          color: #07866f;
          font-weight: 800;
        }

        .checkout-total-row {
          border-top: 1px solid #e5eaf1;
          padding-top: 20px;
          margin-top: 22px;
          font-size: 17px;
        }

        .checkout-total-row strong {
          font-size: 22px;
        }

        .checkout-secure-note,
        .checkout-footer-note {
          color: #7b8798;
          font-size: 12px;
          line-height: 1.6;
        }

        .checkout-submit {
          width: 100%;
          margin-top: 14px;
          padding: 15px;
          border: 0;
          border-radius: 9px;
          background: #102a43;
          color: #fff;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .checkout-submit:hover:not(:disabled) {
          background: #087f73;
          transform: translateY(-1px);
        }

        .checkout-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .checkout-error {
          padding: 11px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          line-height: 1.5;
        }

        .checkout-empty,
        .checkout-loading {
          color: #64748b;
          padding: 20px 0;
        }

        @media (max-width: 800px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }

          .checkout-summary {
            position: static;
          }
        }

        @media (max-width: 480px) {
          .checkout-page {
            padding: 28px 12px 45px;
          }

          .checkout-card,
          .checkout-summary {
            padding: 18px;
          }

          .checkout-item {
            align-items: flex-start;
            gap: 11px;
          }

          .checkout-product-image {
            width: 66px;
            height: 66px;
            flex-basis: 66px;
          }

          .checkout-line-total {
            font-size: 12px;
          }
        }
      `}</style>
    </main>
  );
}

export default Checkout;
