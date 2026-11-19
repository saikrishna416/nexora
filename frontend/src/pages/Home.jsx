import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api, { API_ORIGIN } from "../services/api";
import "./Home.css";

const GUEST_CART_KEY = "nexora_guest_cart";

const heroSlides = [
  {
    kicker: "THE NEXORA EVERYDAY EVENT",
    title: "Good finds. Great everyday.",
    subtitle: "Explore tech, style, home essentials and more—all in one place.",
    button: "Shop all products",
    category: "",
    background: "linear-gradient(110deg, #102a43 0%, #145b66 52%, #8fc7b8 100%)",
    accent: "#baf3df",
  },
  {
    kicker: "LEVEL UP YOUR SETUP",
    title: "A little more wow.",
    subtitle: "Discover useful tech and accessories for work, play and everything between.",
    button: "Explore electronics",
    category: "Electronics",
    background: "linear-gradient(110deg, #172554 0%, #334e8a 58%, #9db9e9 100%)",
    accent: "#dbeafe",
  },
  {
    kicker: "MAKE ROOM FOR COMFORT",
    title: "Refresh your space.",
    subtitle: "Thoughtful home picks that make everyday living feel better.",
    button: "Shop home & living",
    category: "Home & Living",
    background: "linear-gradient(110deg, #5b3528 0%, #b66e4c 58%, #e8c1a0 100%)",
    accent: "#ffead8",
  },
];

const valueHighlights = [
  { label: "Free Pan-India Delivery", Icon: Truck },
  { label: "Secure Razorpay & COD Payments", Icon: ShieldCheck },
  { label: "Easy 7-Day Returns", Icon: RotateCcw },
  { label: "100% Authentic Brands", Icon: PackageCheck },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function getProductCategory(product) {
  const category = product?.category;
  return String(
    product?.category_name ||
      (typeof category === "object"
        ? category?.name || category?.title || category?.slug
        : category) ||
      product?.subcategory_name ||
      product?.subcategory ||
      ""
  );
}

function getProductImage(product) {
  const candidate =
    product?.image ||
    product?.image_url ||
    product?.thumbnail ||
    product?.images?.[0]?.image ||
    product?.images?.[0]?.image_url ||
    "";
  if (typeof candidate !== "string" || !candidate) return "";
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${API_ORIGIN.replace(/\/$/, "")}/${candidate.replace(/^\/+/, "")}`;
}

function getProductPrice(product) {
  return Number(product?.price ?? product?.selling_price ?? 0) || 0;
}

function getProductMrp(product) {
  const mrp = Number(
    product?.mrp ??
      product?.original_price ??
      product?.list_price ??
      product?.mrp_price ??
      0
  );
  return Number.isFinite(mrp) && mrp > getProductPrice(product)
    ? mrp
    : 0;
}

function getWishlistProductId(item) {
  return typeof item?.product === "object" ? item.product?.id : item?.product;
}

function ProductCard({
  product,
  busy,
  wishlisted,
  onAddToCart,
  onToggleWishlist,
}) {
  const price = getProductPrice(product);
  const mrp = getProductMrp(product);
  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const rating = Number(product.average_rating ?? product.rating);
  const image = getProductImage(product);
  const available = Number(product.stock ?? 1) > 0;
  const productPath = `/products/${product.id}`;

  return (
    <article className="nx-home-product-card">
      <div
        className="nx-home-product-media relative w-full h-36 sm:h-40 bg-white rounded-lg border border-gray-100 p-2.5 flex items-center justify-center overflow-hidden"
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "10px",
          border: "1px solid #f1f5f9",
          borderRadius: "9px",
          backgroundColor: "#fff",
          boxSizing: "border-box",
        }}
      >
        <Link
          to={productPath}
          className="nx-home-product-image"
          aria-label={`View ${product.name || "product"}`}
          style={{
            position: "relative",
            inset: "auto",
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {image ? (
            <img
              src={image}
              alt={product.name || "Product"}
              className="nx-home-product-img max-h-full max-w-full w-auto h-auto object-contain"
              loading="lazy"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                height: "auto",
                width: "auto",
                objectFit: "contain",
              }}
            />
          ) : (
            <span className="nx-home-image-placeholder">NEXORA</span>
          )}
        </Link>
        {discount > 0 && (
          <span className="nx-home-discount">{discount}% off</span>
        )}
        <button
          type="button"
          className={`nx-home-wishlist${wishlisted ? " is-active" : ""}`}
          onClick={() => onToggleWishlist(product)}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          disabled={busy}
        >
          <Heart size={17} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="nx-home-product-info">
        <span className="nx-home-product-category">
          {getProductCategory(product) || "Nexora collection"}
        </span>
        <Link className="nx-home-product-title" to={productPath}>
          {product.name || product.title || "Product"}
        </Link>
        <div className="nx-home-product-rating" aria-label={
          Number.isFinite(rating) && rating > 0
            ? `Rated ${rating.toFixed(1)} out of 5`
            : "New product"
        }>
          {Number.isFinite(rating) && rating > 0 ? (
            <>
              <Star size={13} fill="currentColor" />
              <span>{rating.toFixed(1)}</span>
              {Number(product.review_count) > 0 && (
                <small>({product.review_count})</small>
              )}
            </>
          ) : (
            <span className="nx-home-new-label">New</span>
          )}
        </div>
        <div className="nx-home-price-row">
          <strong>{formatINR(price)}</strong>
          {mrp > price && <del>{formatINR(mrp)}</del>}
        </div>
        <button
          type="button"
          className="nx-home-add-button"
          onClick={() => onAddToCart(product)}
          disabled={!available || busy}
        >
          {busy ? "Adding…" : available ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}

function ProductShelf({
  title,
  subtitle,
  products,
  loading,
  busyProductId,
  wishlistItems,
  onAddToCart,
  onToggleWishlist,
  category,
}) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="nx-home-section">
      <div className="nx-home-section-heading">
        <div>
          <span className="nx-home-eyebrow">MADE FOR YOUR EVERYDAY</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <Link
          className="nx-home-view-all"
          to={category
            ? `/products?category=${encodeURIComponent(category)}`
            : "/products"}
        >
          View All <ChevronRight size={17} />
        </Link>
      </div>

      {loading ? (
        <div className="nx-home-shelf-loading" aria-live="polite">
          Loading products…
        </div>
      ) : (
        <div className="nx-home-shelf-track" aria-label={title}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              busy={busyProductId === String(product.id)}
              wishlisted={wishlistItems.some(
                (item) =>
                  String(getWishlistProductId(item)) === String(product.id)
              )}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Home() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [busyProductId, setBusyProductId] = useState("");
  const [wishlistState, setWishlistState] = useState(() => ({
    accessToken,
    items: [],
  }));
  const wishlistItems =
    isAuthenticated && wishlistState.accessToken === accessToken
      ? wishlistState.items
      : [];
  const setWishlistItems = useCallback(
    (nextItems) => {
      setWishlistState((current) => ({
        accessToken,
        items:
          typeof nextItems === "function"
            ? nextItems(
                current.accessToken === accessToken ? current.items : []
              )
            : nextItems,
      }));
    },
    [accessToken]
  );

  useEffect(() => {
    let active = true;
    api
      .get("/products/?page_size=100")
      .then((response) => {
        const data = response.data?.results ?? response.data;
        if (active) setProducts(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to load home products:", error);
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let active = true;
    api
      .get("/wishlist/")
      .then((response) => {
        const items = response.data?.results || response.data;
        if (active) setWishlistItems(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        console.error("Failed to load home wishlist:", error.response?.data || error);
      });

    return () => {
      active = false;
    };
  }, [accessToken, isAuthenticated, setWishlistItems]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const shelves = useMemo(() => {
    const available = products.filter(
      (product) => Number(product.stock ?? 1) > 0
    );
    const trending = [...available]
      .sort((first, second) => {
        const firstRating = Number(first.average_rating || 0);
        const secondRating = Number(second.average_rating || 0);
        const firstReviews = Number(first.review_count || 0);
        const secondReviews = Number(second.review_count || 0);
        return secondRating * Math.log1p(secondReviews) -
          firstRating * Math.log1p(firstReviews);
      })
      .slice(0, 12);
    const electronics = available
      .filter((product) =>
        /electronic|mobile|smartphone|tv|appliance|laptop|computer|audio/i.test(
          `${getProductCategory(product)} ${product.name || ""}`
        )
      )
      .slice(0, 12);
    const fashion = available
      .filter((product) =>
        /fashion|apparel|clothing|shoes|men|women|wear|beauty|lifestyle/i.test(
          `${getProductCategory(product)} ${product.name || ""}`
        )
      )
      .slice(0, 12);
    const recent = [...available]
      .sort(
        (first, second) =>
          new Date(second.created_at || second.updated_at || 0).getTime() -
          new Date(first.created_at || first.updated_at || 0).getTime()
      )
      .slice(0, 12);

    return [
      {
        title: "Top Deals & Trending",
        subtitle: "Popular picks shoppers are loving right now.",
        products: trending,
      },
      {
        title: "Best of Electronics & Mobiles",
        subtitle: "Smart everyday upgrades, all in one place.",
        products: electronics,
        category: "Electronics",
      },
      {
        title: "Fashion & Lifestyle Picks",
        subtitle: "Fresh finds for your everyday look and home.",
        products: fashion,
        category: "Women's Fashion",
      },
      {
        title: "Recently Added / Recommended for You",
        subtitle: "Take a look at more from the Nexora catalogue.",
        products: recent,
      },
    ];
  }, [products]);

  const openCategory = (category) => {
    navigate(
      category
        ? `/products?category=${encodeURIComponent(category)}`
        : "/products"
    );
  };

  const addToCart = async (product) => {
    if (Number(product.stock ?? 1) <= 0 || !product.id) return;
    setBusyProductId(String(product.id));
    setFeedback(null);

    try {
      const rawToken = localStorage.getItem("access_token");
      const hasToken =
        rawToken && !["null", "undefined", ""].includes(rawToken.trim());

      if (isAuthenticated && hasToken) {
        await api.post("/cart/add/", { product: product.id, quantity: 1 });
      } else {
        const guestItems = JSON.parse(
          localStorage.getItem(GUEST_CART_KEY) || "[]"
        );
        const existing = guestItems.find(
          (item) => String(item.product) === String(product.id)
        );
        if (existing) {
          existing.quantity = Math.min(
            Number(existing.quantity || 1) + 1,
            Number(product.stock || 1)
          );
        } else {
          guestItems.push({
            id: `guest-${product.id}-default`,
            product: product.id,
            product_name: product.name || product.title || "Product",
            product_price: getProductPrice(product),
            product_image: getProductImage(product),
            quantity: 1,
            stock: Number(product.stock ?? 1),
          });
        }
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestItems));
      }

      setFeedback({ type: "success", text: "Added to your cart." });
    } catch (error) {
      console.error("Home add-to-cart error:", error.response?.data || error);
      setFeedback({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Could not add this product to your cart. Please try again.",
      });
    } finally {
      setBusyProductId("");
    }
  };

  const toggleWishlist = async (product) => {
    if (!product.id) return;
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/" } });
      return;
    }

    setBusyProductId(String(product.id));
    setFeedback(null);
    try {
      const existing = wishlistItems.find(
        (item) =>
          String(getWishlistProductId(item)) === String(product.id)
      );
      if (existing) {
        await api.delete(`/wishlist/${existing.id}/remove/`);
        setWishlistItems((current) =>
          current.filter((item) => item.id !== existing.id)
        );
        setFeedback({ type: "success", text: "Removed from your wishlist." });
      } else {
        await api.post("/wishlist/add/", { product: product.id });
        const response = await api.get("/wishlist/");
        const items = response.data?.results || response.data;
        setWishlistItems(Array.isArray(items) ? items : []);
        setFeedback({ type: "success", text: "Saved to your wishlist." });
      }
    } catch (error) {
      console.error("Home wishlist update error:", error.response?.data || error);
      setFeedback({
        type: "error",
        text:
          error.response?.data?.detail ||
          "Could not update your wishlist. Please try again.",
      });
    } finally {
      setBusyProductId("");
    }
  };

  const slide = heroSlides[activeSlide];

  return (
    <main className="nx-home">
      <section
        className="nx-home-hero"
        style={{ background: slide.background }}
        aria-roledescription="carousel"
        aria-label="Featured promotions"
      >
        <div className="nx-home-hero-copy">
          <span className="nx-home-hero-kicker" style={{ color: slide.accent }}>
            {slide.kicker}
          </span>
          <h1>{slide.title}</h1>
          <p>{slide.subtitle}</p>
          <button
            type="button"
            className="nx-home-hero-cta"
            onClick={() => openCategory(slide.category)}
          >
            Shop Now <ArrowRight size={17} aria-hidden="true" />
          </button>
          <div className="nx-home-hero-controls">
            <button
              type="button"
              aria-label="Previous promotion"
              onClick={() =>
                setActiveSlide(
                  (activeSlide - 1 + heroSlides.length) % heroSlides.length
                )
              }
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            {heroSlides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-label={`Show promotion ${index + 1}`}
                aria-current={activeSlide === index ? "true" : undefined}
                className={`nx-home-hero-dot${
                  activeSlide === index ? " is-active" : ""
                }`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
            <button
              type="button"
              aria-label="Next promotion"
              onClick={() =>
                setActiveSlide((activeSlide + 1) % heroSlides.length)
              }
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="nx-home-hero-art" aria-hidden="true">
          <div className="nx-home-orbit nx-home-orbit-one" />
          <div className="nx-home-orbit nx-home-orbit-two" />
          <div className="nx-home-hero-card">
            <Zap size={22} fill="currentColor" />
            <span className="nx-home-hero-mark">N</span>
            <strong>Discover more.</strong>
            <small>Find your next favourite</small>
          </div>
          <span className="nx-home-floating nx-home-floating-top">
            Everyday favourites
          </span>
          <span className="nx-home-floating nx-home-floating-bottom">
            Picked for you
          </span>
        </div>
      </section>

      {feedback && (
        <p
          className={`nx-home-feedback nx-home-feedback--${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.text}
        </p>
      )}

      {shelves.map((shelf) => (
        <ProductShelf
          key={shelf.title}
          {...shelf}
          loading={loadingProducts}
          busyProductId={busyProductId}
          wishlistItems={wishlistItems}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
        />
      ))}

      <section className="nx-home-values" aria-label="Shopping benefits">
        {valueHighlights.map(({ label, Icon }) => (
          <div className="nx-home-value" key={label}>
            <span><Icon size={19} aria-hidden="true" /></span>
            <strong>{label}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Home;
