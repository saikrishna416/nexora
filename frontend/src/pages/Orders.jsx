import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { formatOrderId } from "../utils/orderFormat";
import {
  getOrderTrackingState,
  getRefundTrackingState,
  useOrderTrackingNow,
} from "../utils/orderTracking";
import "./OrderPages.css";

/* ─── helpers ─────────────────────────────────────────────── */
const ORDER_STATUSES = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function StatusBadge({ value, label }) {
  const status = String(value || "pending").toLowerCase();
  const badgeStatus =
    status === "pending"
      ? "confirmed"
      : status === "out_for_delivery"
        ? "shipped"
        : status;
  const knownStatus = ["confirmed", "shipped", "delivered", "cancelled"].includes(
    badgeStatus
  );
  return (
    <span className={`order-status order-status--${knownStatus ? badgeStatus : "default"}`}>
      <span className="order-status-dot" aria-hidden="true" />
      {label || status}
    </span>
  );
}

function PaymentStatusBadge({ status, label }) {
  const knownStatus = [
    "pending",
    "paid",
    "failed",
    "refunded",
    "refund-initiated",
    "cancelled",
  ].includes(status);
  return (
    <span
      className={`order-payment-status order-payment-status--${
        knownStatus ? status : "default"
      }`}
    >
      <span className="order-status-dot" aria-hidden="true" />
      {label || status}
    </span>
  );
}

function getProductId(item) {
  return typeof item.product === "object" ? item.product?.id : item.product;
}

function getShipToName(address) {
  if (address && typeof address === "object") {
    return address.full_name || address.name || address.recipient_name || "Shipping address";
  }
  const firstLine = String(address || "").split(/\r?\n/)[0];
  return firstLine.split(",")[0].trim() || "Shipping address";
}

function getItemVariant(item) {
  const variant = item.variant || item.product_variant || {};
  const details = [
    typeof variant === "string" ? variant : variant.name,
    item.size || variant.size ? `Size ${item.size || variant.size}` : "",
    item.color || variant.color,
  ].filter(Boolean);
  return details;
}

/* ─── Review Modal ────────────────────────────────────────── */
function ReviewModal({ item, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]); // { file, preview }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const productId = item.product;
  const productName = item.product_name || "this product";
  const productImage =
    item.product_image || item.image || item.product?.image || "";

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.slice(0, 5 - photos.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write a review before submitting.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append("product", productId);
      form.append("rating", rating);
      form.append("comment", comment.trim());
      photos.forEach((p) => form.append("images", p.file));

      await api.post(`/reviews/products/${productId}/`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setTimeout(() => {
        onSubmitted && onSubmitted(productId);
        onClose();
      }, 1800);
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
          (Array.isArray(data)
            ? data[0]
            : typeof data === "object"
            ? Object.values(data).flat()[0]
            : null) ||
          "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(15,23,42,.6)",
        backdropFilter: "blur(4px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(100%,540px)",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "16px",
          background: "#fff",
          padding: "28px",
          boxSizing: "border-box",
          boxShadow: "0 24px 70px rgba(0,0,0,.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: ".07em" }}>
                Write a Review
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>
                {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "#f3f4f6", border: 0, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700, color: "#166534", fontSize: 16 }}>Review submitted!</p>
            <p style={{ color: "#6b7280", fontSize: 14 }}>Thank you for your feedback.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Star rating */}
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#374151" }}>
              Your Rating
            </label>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  style={{
                    fontSize: 32,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: s <= (hoverRating || rating) ? "#f59e0b" : "#d1d5db",
                    padding: "2px 3px",
                    lineHeight: 1,
                    transition: "color .15s",
                  }}
                  aria-label={`${s} star${s > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
              <span style={{ alignSelf: "center", fontSize: 13, color: "#6b7280", marginLeft: 4 }}>
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][hoverRating || rating]}
              </span>
            </div>

            {/* Comment */}
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#374151" }}>
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience with this product..."
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#0f766e"; }}
              onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; }}
            />

            {/* Photo upload */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 700, color: "#374151" }}>
                Add Photos <span style={{ fontWeight: 400, color: "#6b7280" }}>(optional, up to 5)</span>
              </label>
              {photos.length < 5 && (
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    border: "1px dashed #9ca3af",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#0f766e",
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  📷 Choose photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoAdd}
                    style={{ display: "none" }}
                  />
                </label>
              )}
              {photos.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img
                        src={p.preview}
                        alt={`preview ${i + 1}`}
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p style={{ margin: "12px 0 0", padding: "10px 14px", background: "#fee2e2", borderRadius: 8, color: "#991b1b", fontSize: 13 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 44,
                  border: 0,
                  borderRadius: 8,
                  background: submitting ? "#9ca3af" : "#0f766e",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 44,
                  padding: "0 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Main Orders Component ───────────────────────────────── */
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myReviews, setMyReviews] = useState({}); // productId → true
  const [reviewModal, setReviewModal] = useState(null); // item object or null
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const now = useOrderTrackingNow();

  useEffect(() => {
    api
      .get("/orders/")
      .then((res) => setOrders(res.data.results || res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load orders.");
      })
      .finally(() => setLoading(false));

    // Fetch existing reviews so we know which products already have one
    api
      .get("/reviews/my-reviews/")
      .then((res) => {
        const list = res.data.results || res.data;
        const map = {};
        list.forEach((r) => { map[r.product] = true; });
        setMyReviews(map);
      })
      .catch(() => {}); // non-critical
  }, []);

  const handleReviewSubmitted = useCallback((productId) => {
    setMyReviews((prev) => ({ ...prev, [productId]: true }));
  }, []);

  const handlePayNow = (order) => {
    navigate("/payment", {
      state: {
        orderId: order.id,
        orderNumber: order.order_number,
      },
    });
  };

  const canWriteReview = (order, item) => {
    if (myReviews[item.product]) return false;
    const status = String(order.status || "").toLowerCase();
    const paidOrDelivered =
      order.payment_status === "paid" ||
      ["delivered", "confirmed", "shipped", "out_for_delivery"].includes(status);
    return paidOrDelivered && status !== "cancelled";
  };

  const ordersWithTracking = orders.map((order) => ({
    order,
    tracking: getOrderTrackingState(order, now),
  }));
  const filteredOrders = ordersWithTracking.filter(({ order, tracking }) => {
    const matchesStatus =
      statusFilter === "all" || tracking.filterStatus === statusFilter;
    const searchable = [
      order.id,
      order.order_number,
      formatOrderId(order),
      ...(order.items || []).map((item) => item.product_name),
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && searchable.includes(searchTerm.trim().toLowerCase());
  });

  const getStatusCount = (status) =>
    status === "all"
      ? ordersWithTracking.length
      : ordersWithTracking.filter(
          ({ tracking }) => tracking.filterStatus === status
        ).length;

  /* ── loading / error / empty states ── */
  if (loading) {
    return <main className="orders-page order-page-loading">Loading your orders…</main>;
  }

  if (error) {
    return (
      <main className="orders-page order-page-error" role="alert">{error}</main>
    );
  }

  return (
    <main className="orders-page">
      <header className="orders-toolbar">
        <div>
          <h1 className="orders-heading">My Orders</h1>
          <p className="orders-count">
            <strong>{orders.length}</strong>{" "}
            {orders.length === 1 ? "order" : "orders"} in your account
          </p>
        </div>
        <label className="orders-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by product or order ID"
            aria-label="Search orders by product name or order ID"
          />
        </label>
      </header>

      <nav className="orders-filters" aria-label="Filter orders by status">
        {ORDER_STATUSES.map((option) => (
          <button
            className={`orders-filter${statusFilter === option.value ? " is-active" : ""}`}
            key={option.value}
            type="button"
            aria-pressed={statusFilter === option.value}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
            <span className="orders-filter-count">{getStatusCount(option.value)}</span>
          </button>
        ))}
      </nav>

      {filteredOrders.length === 0 ? (
        <section className="order-empty-state">
          <span className="order-empty-icon">
            <ShoppingBag size={30} aria-hidden="true" />
          </span>
          <h2>{orders.length ? "No matching orders" : "No orders yet"}</h2>
          <p>
            {orders.length
              ? "Try another search or status filter to find your order."
              : "Your next favorite find is just around the corner."}
          </p>
          <Link className="order-link-button order-link-button--primary" to="/products">
            Start Shopping <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <section className="orders-list" aria-label="Your orders">
          {filteredOrders.map(({ order, tracking }) => {
            const orderNumber = formatOrderId(order);
            const paymentInfo = tracking.paymentInfo;
            const refundTracking = getRefundTrackingState(order, now);
            const isPendingPayment =
              order.payment_status === "pending" &&
              !["cancelled", "delivered"].includes(tracking.status) &&
              !paymentInfo.isCod;
            const paymentBadgeStatus = refundTracking.isCancelled
              ? refundTracking.paymentBadgeStatus
              : paymentInfo.paymentLabel === "Paid"
                ? "paid"
                : paymentInfo.isCod
                  ? "pending"
                  : order.payment_status || "pending";
            const paymentStatusLabel = refundTracking.isCancelled
              ? refundTracking.paymentStatusLabel
              : paymentInfo.paymentLabel;
            const placedDate = order.created_at
              ? new Date(order.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date unavailable";

            return (
              <article className="order-card" key={order.id}>
                <header className="order-card-meta">
                  <div className="order-meta-cell">
                    <span className="order-meta-label">Order placed</span>
                    <span className="order-meta-value">
                      <CalendarDays size={14} aria-hidden="true" /> {placedDate}
                    </span>
                  </div>
                  <div className="order-meta-cell">
                    <span className="order-meta-label">Total</span>
                    <span className="order-meta-value">{formatINR(order.total_amount)}</span>
                  </div>
                  <div className="order-meta-cell">
                    <span className="order-meta-label">Ship to</span>
                    <span className="order-meta-value order-meta-address">
                      <MapPin size={14} aria-hidden="true" /> {getShipToName(order.shipping_address)}
                    </span>
                  </div>
                  <div className="order-meta-cell order-meta-id">
                    <span className="order-meta-label">Order ID</span>
                    <span className="order-meta-value">{orderNumber}</span>
                  </div>
                  <div className="order-meta-actions">
                    {isPendingPayment && (
                      <button
                        type="button"
                        onClick={() => handlePayNow(order)}
                        className="order-action-button order-action-button--primary"
                      >
                        Pay Now
                      </button>
                    )}
                    <Link
                      className="order-link-button"
                      to={`/orders/${order.id}`}
                      aria-label={`View order details for ${orderNumber}`}
                    >
                      View Order Details <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </header>

                <div className="order-card-body">
                  {(order.items || []).length ? (order.items || []).map((item, itemIndex) => {
                    const productId = getProductId(item);
                    const productPath = productId ? `/products/${productId}` : "/products";
                    const image = item.product_image || item.image || item.product?.image;
                    const variant = getItemVariant(item);
                    const alreadyReviewed = !!myReviews[productId];
                    const showWriteReview = canWriteReview(
                      { ...order, status: tracking.status },
                      item
                    );
                    const canTrack = !["delivered", "cancelled"].includes(tracking.status);

                    return (
                      <article className="order-product-row" key={item.id}>
                        <div className="order-product-thumb" aria-hidden="true">
                          <Package className="order-product-fallback" size={25} />
                          {image && (
                            <img
                              src={image}
                              alt={item.product_name || "Product"}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                        <div className="order-product-copy">
                          <Link className="order-product-title" to={productPath}>
                            {item.product_name || "Product"}
                          </Link>
                          <div className="order-product-meta">
                            {variant.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <div className={`order-delivery-label order-delivery-label--${tracking.tone}`}>
                            <span className="order-status-dot" aria-hidden="true" />
                            <span className="order-mobile-status-label">
                              {tracking.statusLabel}
                            </span>
                            <span className="order-mobile-status-separator" aria-hidden="true">·</span>
                            <span className="order-delivery-text">{tracking.deliveryMessage}</span>
                          </div>
                          {itemIndex === 0 && refundTracking.isPaidOnline && (
                            <span className="order-refund-mobile-message">
                              {refundTracking.listMessage}
                            </span>
                          )}
                          <span className="order-mobile-order-id">
                            Order ID: {orderNumber} · {formatINR(order.total_amount)}
                          </span>
                          <div className="order-product-price">
                            {formatINR(item.price)} <span aria-hidden="true">·</span> Line total {formatINR(item.subtotal)}
                          </div>
                        </div>
                        <div className="order-product-actions">
                          <StatusBadge value={tracking.status} label={tracking.statusLabel} />
                          {itemIndex === 0 && refundTracking.isPaidOnline && (
                            <span className="order-refund-list-message">
                              {refundTracking.listMessage}
                            </span>
                          )}
                          <span className="order-payment-label">
                            {paymentInfo.methodLabel}
                          </span>
                          <PaymentStatusBadge
                            status={paymentBadgeStatus}
                            label={paymentStatusLabel}
                          />
                          {canTrack ? (
                            <Link
                              className="order-link-button order-link-button--quiet"
                              to={`/orders/${order.id}#order-tracking`}
                            >
                              <Truck size={14} aria-hidden="true" /> Track Package
                            </Link>
                          ) : (
                            <Link
                              className="order-link-button order-link-button--quiet"
                              to={productPath}
                            >
                              <ShoppingBag size={14} aria-hidden="true" /> Buy Again
                            </Link>
                          )}
                          {alreadyReviewed ? (
                            <span className="order-reviewed-note">Reviewed</span>
                          ) : showWriteReview ? (
                            <button
                              className="order-action-button order-link-button--quiet"
                              type="button"
                              onClick={() => setReviewModal(item)}
                            >
                              Write a Review
                            </button>
                          ) : null}
                        </div>
                        <Link
                          className="order-mobile-overlay"
                          to={`/orders/${order.id}`}
                          aria-label={`Open order ID ${orderNumber}, ${item.product_name || "product"}`}
                        />
                        <ChevronRight className="order-mobile-chevron" size={19} aria-hidden="true" />
                      </article>
                    );
                  }) : (
                    <div className="order-product-row order-empty-product-row">
                      <div className="order-product-thumb order-empty-thumb" aria-hidden="true">
                        <Package size={25} />
                      </div>
                      <div className="order-product-copy">
                        <strong className="order-product-title">Order details</strong>
                        <div className={`order-delivery-label order-delivery-label--${tracking.tone}`}>
                          <span className="order-status-dot" aria-hidden="true" />
                          <span className="order-mobile-status-label">{tracking.statusLabel}</span>
                          <span className="order-mobile-status-separator" aria-hidden="true">·</span>
                          <span className="order-delivery-text">{tracking.deliveryMessage}</span>
                        </div>
                        <span className="order-mobile-order-id">Order ID: {orderNumber}</span>
                      </div>
                      <Link className="order-mobile-overlay" to={`/orders/${order.id}`} aria-label={`Open order ID ${orderNumber}`} />
                      <ChevronRight className="order-mobile-chevron" size={19} aria-hidden="true" />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Review modal */}
      {reviewModal && (
        <ReviewModal
          item={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </main>
  );
}

export default Orders;
