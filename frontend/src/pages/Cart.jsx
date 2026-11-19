import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import api, { API_ORIGIN } from "../services/api";
import "./CartWishlist.css";

const GUEST_CART_KEY = "nexora_guest_cart";
const CART_SELECTIONS_KEY = "nexora_cart_selections";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function hasAccessToken() {
  const token = localStorage.getItem("access_token");
  return Boolean(token && !["null", "undefined", ""].includes(token.trim()));
}

function buildGuestCart(items) {
  const normalized = items.map((item) => ({
    ...item,
    subtotal: getItemPrice(item) * Number(item.quantity || 1),
  }));
  return {
    items: normalized,
    total: normalized.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
  };
}

function getItemPrice(item) {
  return Number(
    item.selected_price ??
      item.product_price ??
      item.price ??
      item.product?.price
  ) || 0;
}

function getItemMrp(item) {
  const mrp = Number(
    item.selected_mrp ??
      item.mrp ??
      item.original_price ??
      item.product_mrp ??
      item.list_price
  );
  return Number.isFinite(mrp) && mrp > 0 ? Math.max(mrp, getItemPrice(item)) : getItemPrice(item);
}

function getProductId(item) {
  return typeof item.product === "object" ? item.product?.id : item.product;
}

function applySavedSelections(cartData) {
  const items = Array.isArray(cartData?.items) ? cartData.items : [];
  let selections = {};
  try {
    selections = JSON.parse(localStorage.getItem(CART_SELECTIONS_KEY) || "{}");
  } catch (error) {
    console.warn("Could not read saved cart selections:", error);
  }
  const normalized = items.map((item) => {
    const saved = selections[String(getProductId(item))] || {};
    const selected = {
      ...item,
      ...Object.fromEntries(
        ["selected_size", "selected_variant", "selected_color", "selected_price", "selected_mrp"]
          .filter((key) => saved[key] !== undefined)
          .map((key) => [key, saved[key]])
      ),
    };
    const subtotal = getItemPrice(selected) * Number(item.quantity || 1);
    return {
      ...selected,
      product_price: getItemPrice(selected),
      subtotal,
    };
  });
  return {
    ...cartData,
    items: normalized,
    total: normalized.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
  };
}

function clearSavedSelection(productId) {
  if (!productId) return;
  try {
    const selections = JSON.parse(localStorage.getItem(CART_SELECTIONS_KEY) || "{}");
    delete selections[String(productId)];
    localStorage.setItem(CART_SELECTIONS_KEY, JSON.stringify(selections));
  } catch (error) {
    console.warn("Could not clear saved cart selection:", error);
  }
}

function getImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

function getDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyItems, setBusyItems] = useState({});
  const isLoggedIn = hasAccessToken();
  const items = Array.isArray(cart.items) ? cart.items : [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const grandTotal = Number.isFinite(Number(cart.total))
    ? Number(cart.total)
    : items.reduce(
        (sum, item) => sum + getItemPrice(item) * (Number(item.quantity) || 0),
        0
      );
  const listPrice = items.reduce(
    (sum, item) => sum + getItemMrp(item) * (Number(item.quantity) || 0),
    0
  );
  const discount = Math.max(0, listPrice - grandTotal);

  const refreshCart = async () => {
    if (!hasAccessToken()) {
      const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
      setCart(buildGuestCart(guestItems));
      return;
    }

    const response = await api.get("/cart/");
    setCart(applySavedSelections(response.data));
  };

  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      try {
        if (!hasAccessToken()) {
          const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
          if (!cancelled) setCart(buildGuestCart(guestItems));
        } else {
          const response = await api.get("/cart/");
          if (!cancelled) setCart(applySavedSelections(response.data));
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error("Failed to load cart:", loadError.response?.data || loadError);
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

  const setBusy = (itemId, busy) => {
    setBusyItems((current) => ({ ...current, [itemId]: busy }));
  };

  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1 || busyItems[item.id]) return;

    setError("");
    setNotice("");
    setBusy(item.id, true);
    try {
      if (!hasAccessToken()) {
        const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
        const stock = Number(item.stock ?? 99);
        const updated = guestItems.map((entry) =>
          String(entry.id) === String(item.id)
            ? {
                ...entry,
                quantity: stock > 0 ? Math.min(newQuantity, stock) : newQuantity,
              }
            : entry
        );
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
        setCart(buildGuestCart(updated));
      } else {
        const response = await api.patch(`/cart/items/${item.id}/`, {
          quantity: newQuantity,
        });
        setCart(applySavedSelections(response.data));
      }
    } catch (updateError) {
      console.error("Quantity update error:", updateError.response?.data || updateError);
      setError(
        updateError.response?.data?.detail || "Failed to update quantity. Please try again."
      );
    } finally {
      setBusy(item.id, false);
    }
  };

  const removeItem = async (item) => {
    if (busyItems[item.id]) return;

    setError("");
    setNotice("");
    setBusy(item.id, true);
    try {
      if (!hasAccessToken()) {
        const guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
        const updated = guestItems.filter((entry) => String(entry.id) !== String(item.id));
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
        setCart(buildGuestCart(updated));
      } else {
        const response = await api.delete(`/cart/items/${item.id}/remove/`);
        setCart(applySavedSelections(response.data));
        clearSavedSelection(getProductId(item));
      }
    } catch (removeError) {
      console.error("Remove item error:", removeError.response?.data || removeError);
      setError(removeError.response?.data?.detail || "Failed to remove item.");
    } finally {
      setBusy(item.id, false);
    }
  };

  const saveForLater = async (item) => {
    if (!hasAccessToken()) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    const productId = getProductId(item);
    if (!productId || busyItems[item.id]) return;

    setError("");
    setNotice("");
    setBusy(item.id, true);
    try {
      await api.post("/wishlist/add/", { product: productId });
      try {
        const response = await api.delete(`/cart/items/${item.id}/remove/`);
        setCart(applySavedSelections(response.data));
        clearSavedSelection(productId);
        setNotice(`${item.product_name || "Item"} saved for later in your wishlist.`);
      } catch (removeError) {
        console.error(
          "Remove saved item from cart error:",
          removeError.response?.data || removeError
        );
        setError("Saved to your wishlist, but could not remove it from the cart.");
        try {
          await refreshCart();
        } catch (refreshError) {
          console.error("Cart refresh after save error:", refreshError.response?.data || refreshError);
          setError("Saved to your wishlist, but the cart could not refresh. Please reload.");
        }
      }
    } catch (saveError) {
      console.error("Save for later error:", saveError.response?.data || saveError);
      setError(
        saveError.response?.data?.detail ||
          "Could not save this item for later. It is still in your cart."
      );
    } finally {
      setBusy(item.id, false);
    }
  };

  const placeOrder = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    navigate("/checkout", {
      state: {
        items: items.map((item) => ({
          ...item,
          image:
            item.image ||
            item.image_url ||
            item.thumbnail ||
            item.product_image ||
            item.product?.image ||
            item.product?.image_url ||
            "",
          price: getItemPrice(item),
          selected_price: getItemPrice(item),
          selected_mrp: getItemMrp(item),
          quantity: Number(item.quantity ?? item.qty ?? 1),
        })),
        total: grandTotal,
      },
    });
  };

  if (loading) {
    return (
      <main className="nx-cart-page nx-cart-state" aria-live="polite">
        Loading your cart…
      </main>
    );
  }

  if (error && !items.length) {
    return (
      <main className="nx-cart-page nx-cart-state" role="alert">
        <p>{error}</p>
        <button className="nx-button nx-button--primary" type="button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="nx-cart-page nx-cart-page--empty">
        <section className="nx-cart-empty-card">
          <span className="nx-cart-empty-icon">
            <ShoppingCart size={34} aria-hidden="true" />
          </span>
          <h1>Your cart is empty!</h1>
          <p>Find something you love and it will be waiting here.</p>
          <Link className="nx-button nx-button--primary" to="/products">
            Shop Now <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="nx-cart-page">
      <header className="nx-cart-header">
        <div>
          <h1>My Cart <span>({itemCount})</span></h1>
          {!isLoggedIn && (
            <p className="nx-cart-session-note">
              Your items are saved in this browser. Sign in to sync your cart.
            </p>
          )}
        </div>
        <div className="nx-cart-delivery-strip">
          <Truck size={17} aria-hidden="true" />
          <span>Delivery by <strong>{getDeliveryDate()}</strong> <i aria-hidden="true">|</i> <b>Free</b></span>
        </div>
      </header>

      {error && <p className="nx-cart-feedback nx-cart-feedback--error" role="alert">{error}</p>}
      {notice && <p className="nx-cart-feedback nx-cart-feedback--success" role="status">{notice}</p>}

      <div className="nx-cart-layout">
        <section className="nx-cart-items" aria-label="Items in your cart">
          {items.map((item) => {
            const productId = getProductId(item);
            const productPath = productId ? `/products/${productId}` : "/products";
            const unitPrice = getItemPrice(item);
            const mrp = getItemMrp(item);
            const quantity = Number(item.quantity) || 1;
            const lineTotal = Number(item.subtotal) || unitPrice * quantity;
            const stock = Number(item.stock);
            const hasStock = Number.isFinite(stock);
            const isOutOfStock = hasStock && stock <= 0;
            const image = item.product_image || item.image || item.product?.image;

            return (
              <article className="nx-cart-item" key={item.id}>
                <Link
                  className="nx-cart-item-image"
                  to={productPath}
                  aria-label={`View ${item.product_name || "product"}`}
                >
                  <Package className="nx-cart-image-fallback" size={28} aria-hidden="true" />
                  {image && (
                    <img
                      src={getImageUrl(image)}
                      alt={item.product_name || "Cart product"}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </Link>

                <div className="nx-cart-item-info">
                  <div className="nx-cart-item-heading">
                    <Link className="nx-cart-product-title" to={productPath}>
                      {item.product_name || "Product"}
                    </Link>
                    <strong className="nx-cart-line-total">{formatINR(lineTotal)}</strong>
                  </div>
                  {item.selected_size && <p className="nx-cart-variant">Size: {item.selected_size}</p>}
                  {item.selected_variant && <p className="nx-cart-variant">Variant: {item.selected_variant}</p>}
                  {item.selected_color && <p className="nx-cart-variant">Color: {item.selected_color}</p>}
                  <div className="nx-cart-price-line">
                    <strong>{formatINR(unitPrice)}</strong>
                    {mrp > unitPrice && (
                      <>
                        <del>{formatINR(mrp)}</del>
                        <span className="nx-cart-discount">
                          {Math.round(((mrp - unitPrice) / mrp) * 100)}% off
                        </span>
                      </>
                    )}
                  </div>
                  <p className={`nx-cart-stock${isOutOfStock ? " is-out-of-stock" : ""}`}>
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {isOutOfStock ? "Out of Stock" : "In Stock · Free Delivery"}
                  </p>

                  <div className="nx-cart-item-actions">
                    <div className="nx-quantity-stepper" aria-label={`Quantity for ${item.product_name || "product"}`}>
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item, quantity - 1)}
                        disabled={quantity <= 1 || busyItems[item.id]}
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item, quantity + 1)}
                        disabled={busyItems[item.id] || (hasStock && quantity >= stock)}
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      className="nx-cart-text-action"
                      type="button"
                      onClick={() => saveForLater(item)}
                      disabled={busyItems[item.id]}
                    >
                      Save for Later
                    </button>
                    <button
                      className="nx-cart-text-action nx-cart-text-action--remove"
                      type="button"
                      onClick={() => removeItem(item)}
                      disabled={busyItems[item.id]}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="nx-cart-sidebar">
          <section className="nx-cart-summary" aria-label="Price details">
            <h2>PRICE DETAILS</h2>
            <div className="nx-cart-summary-row">
              <span>Price ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
              <span>{formatINR(listPrice)}</span>
            </div>
            {discount > 0 && (
              <div className="nx-cart-summary-row nx-cart-summary-row--discount">
                <span>Discount</span><span>−{formatINR(discount)}</span>
              </div>
            )}
            <div className="nx-cart-summary-row nx-cart-summary-row--delivery">
              <span>Delivery Charges</span><span>FREE</span>
            </div>
            <div className="nx-cart-summary-total">
              <span>Total Amount</span><strong>{formatINR(grandTotal)}</strong>
            </div>
            <p className="nx-cart-savings">
              {discount > 0
                ? `You save ${formatINR(discount)} on this order`
                : "Secure checkout with no hidden charges"}
            </p>
            <button className="nx-button nx-button--primary nx-cart-place-order" type="button" onClick={placeOrder}>
              Place Order <ArrowRight size={16} aria-hidden="true" />
            </button>
            <Link className="nx-cart-continue" to="/products">Continue Shopping</Link>
          </section>
          <div className="nx-cart-trust">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Safe and Secure Payments <b>·</b> Easy Returns <b>·</b> 100% Authentic Products</span>
          </div>
        </aside>
      </div>

      <div className="nx-cart-sticky-checkout" aria-label="Checkout summary">
        <div>
          <span>Grand Total</span>
          <strong>{formatINR(grandTotal)}</strong>
        </div>
        <button className="nx-button nx-button--primary" type="button" onClick={placeOrder}>
          Place Order <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}

export default Cart;
