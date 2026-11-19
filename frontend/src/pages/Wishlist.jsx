import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Package,
  Search,
  ShoppingCart,
  Star,
  Trash2,
} from "lucide-react";
import api, { API_ORIGIN } from "../services/api";
import "./CartWishlist.css";

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function getProductId(item) {
  return typeof item.product === "object" ? item.product?.id : item.product;
}

function hasAccessToken() {
  const token = localStorage.getItem("access_token");
  return Boolean(token && !["null", "undefined", ""].includes(token.trim()));
}

function getImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN.replace(/\/$/, "")}/${image.replace(/^\//, "")}`;
}

function getCategoryLabel(item) {
  const category = item.category_name || item.category || item.product?.category;
  if (typeof category === "object") return category?.name || "Saved item";
  return category || "Saved item";
}

function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busyItems, setBusyItems] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/wishlist/")
      .then((response) => {
        if (active) setWishlist(response.data.results || response.data);
      })
      .catch((loadError) => {
        console.error("Load wishlist error:", loadError.response?.data || loadError);
        if (active) {
          setLoadError(
            loadError.response?.status === 401
              ? "Please sign in to view your wishlist."
              : "Failed to load wishlist. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const setBusy = (itemId, busy) => {
    setBusyItems((current) => ({ ...current, [itemId]: busy }));
  };

  const removeFromWishlist = async (item) => {
    if (busyItems[item.id]) return;

    setBusy(item.id, true);
    setFeedback(null);
    try {
      await api.delete(`/wishlist/${item.id}/remove/`);
      setWishlist((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback({
        type: "success",
        message: `${item.product_name || "Item"} removed from your wishlist.`,
      });
    } catch (removeError) {
      console.error("Remove wishlist error:", removeError.response?.data || removeError);
      setFeedback({
        type: "error",
        message: "Failed to remove item from wishlist. Please try again.",
      });
    } finally {
      setBusy(item.id, false);
    }
  };

  const moveToCart = async (item) => {
    const productId = getProductId(item);
    if (!productId || busyItems[item.id]) return;

    if (!hasAccessToken()) {
      navigate("/login", { state: { from: "/wishlist" } });
      return;
    }

    setBusy(item.id, true);
    setFeedback(null);
    try {
      await api.post("/cart/add/", { product: productId, quantity: 1 });
    } catch (addError) {
      console.error("Move wishlist item to cart error:", addError.response?.data || addError);
      setFeedback({
        type: "error",
        message:
          addError.response?.data?.detail ||
          "Could not add this item to your cart. It remains in your wishlist.",
      });
      setBusy(item.id, false);
      return;
    }

    try {
      await api.delete(`/wishlist/${item.id}/remove/`);
      setWishlist((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback({
        type: "success",
        message: `${item.product_name || "Item"} moved to your cart.`,
      });
    } catch (removeError) {
      console.error(
        "Remove moved wishlist item error:",
        removeError.response?.data || removeError
      );
      setFeedback({
        type: "error",
        message: "Added to your cart, but could not remove this item from your wishlist.",
      });
    } finally {
      setBusy(item.id, false);
    }
  };

  const filteredWishlist = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return wishlist;
    return wishlist.filter((item) =>
      `${item.product_name || ""} ${getCategoryLabel(item)}`.toLowerCase().includes(query)
    );
  }, [wishlist, searchTerm]);

  if (loading) {
    return (
      <main className="nx-wishlist-page nx-wishlist-state" aria-live="polite">
        Loading your wishlist…
      </main>
    );
  }

  if (loadError) {
    const requiresSignIn = loadError.startsWith("Please sign in");
    return (
      <main className="nx-wishlist-page">
        <section className="nx-wishlist-empty-card" role="alert">
          <Heart size={30} aria-hidden="true" />
          <h1>Wishlist unavailable</h1>
          <p>{loadError}</p>
          <Link className="nx-button nx-button--primary" to={requiresSignIn ? "/login" : "/products"}>
            {requiresSignIn ? "Sign In" : "Continue Shopping"} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="nx-wishlist-page">
      <header className="nx-wishlist-header">
        <div>
          <h1>My Wishlist <span>({wishlist.length})</span></h1>
          <p>Keep your favorite finds close by.</p>
        </div>
        {wishlist.length > 1 && (
          <label className="nx-wishlist-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search wishlist"
              aria-label="Search wishlist products"
            />
          </label>
        )}
      </header>

      {feedback && (
        <p
          className={`nx-cart-feedback nx-cart-feedback--${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      )}

      {wishlist.length === 0 ? (
        <section className="nx-wishlist-empty-card">
          <span className="nx-cart-empty-icon">
            <Heart size={34} aria-hidden="true" />
          </span>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and find them here later.</p>
          <Link className="nx-button nx-button--primary" to="/products">
            Explore Products <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      ) : filteredWishlist.length === 0 ? (
        <section className="nx-wishlist-no-results">
          <h2>No matching products</h2>
          <p>Try another product name or category.</p>
        </section>
      ) : (
        <section className="nx-wishlist-grid" aria-label="Wishlist products">
          {filteredWishlist.map((item) => {
            const productId = getProductId(item);
            const productPath = productId ? `/products/${productId}` : "/products";
            const image = item.product_image || item.image || item.product?.image;
            const rating = Number(item.rating ?? item.product_rating);

            return (
              <article className="nx-wishlist-card" key={item.id}>
                <Link
                  className="nx-wishlist-image"
                  to={productPath}
                  aria-label={`View ${item.product_name || "product"}`}
                >
                  <Package className="nx-cart-image-fallback" size={28} aria-hidden="true" />
                  {image && (
                    <img
                      src={getImageUrl(image)}
                      alt={item.product_name || "Wishlist product"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </Link>

                <button
                  className="nx-wishlist-remove"
                  type="button"
                  onClick={() => removeFromWishlist(item)}
                  disabled={busyItems[item.id]}
                  aria-label={`Remove ${item.product_name || "product"} from wishlist`}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>

                <div className="nx-wishlist-info">
                  <div className="nx-wishlist-tags">
                    <span className="nx-wishlist-category">{getCategoryLabel(item)}</span>
                    {Number.isFinite(rating) && rating > 0 && (
                      <span className="nx-wishlist-rating">
                        <Star size={12} fill="currentColor" aria-hidden="true" /> {rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <Link className="nx-wishlist-title" to={productPath}>
                    {item.product_name || "Product"}
                  </Link>
                  <strong className="nx-wishlist-price">{formatINR(item.product_price)}</strong>
                  <div className="nx-wishlist-actions">
                    <button
                      className="nx-button nx-button--primary"
                      type="button"
                      onClick={() => moveToCart(item)}
                      disabled={busyItems[item.id]}
                    >
                      <ShoppingCart size={15} aria-hidden="true" />
                      {busyItems[item.id] ? "Moving…" : "Move to Cart"}
                    </button>
                    <Link className="nx-wishlist-details" to={productPath}>
                      View
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default Wishlist;
