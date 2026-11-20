import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import api from "../services/api";
import { getCachedProducts, invalidateProductsCache } from "../utils/productCatalogCache";
import { formatOrderId } from "../utils/orderFormat";
import {
  getOrderTrackingState,
  getRefundTrackingState,
  useOrderTrackingNow,
} from "../utils/orderTracking";
import "./OrderPages.css";

const ORDER_STEPS = [
  "Order Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];
const RETURN_REASONS = [
  "Wrong size / variant received",
  "Damaged or defective product",
  "Product not as described",
  "Quality not as expected",
  "Received wrong item",
];
const RETURN_DEMO_STEP_MS = 30_000;
const EXCHANGE_VARIANT_DEFINITIONS = {
  iphone: {
    label: "Storage",
    baseKey: "256",
    options: [
      { key: "128", label: "128 GB", offset: 0, minPrice: 1000 },
      { key: "256", label: "256 GB", offset: 10000 },
      { key: "512", label: "512 GB", offset: 30000 },
    ],
  },
  s26: {
    label: "RAM & Storage",
    baseKey: "12/256",
    options: [
      { key: "12/256", label: "12 GB RAM | 256 GB", offset: 0 },
      { key: "12/512", label: "12 GB RAM | 512 GB", offset: 12000 },
    ],
  },
  mobile: {
    label: "RAM & Storage",
    baseKey: "8/128",
    options: [
      { key: "8/128", label: "8 GB RAM | 128 GB", offset: 0 },
      { key: "8/256", label: "8 GB RAM | 256 GB", offset: 3000 },
      { key: "12/256", label: "12 GB RAM | 256 GB", offset: 6000 },
    ],
  },
  galaxyBook: {
    label: "Configuration (RAM & SSD)",
    baseKey: "8/512",
    options: [
      { key: "8/512", label: "8 GB RAM | 512 GB SSD", offset: 0 },
      { key: "16/1024", label: "16 GB RAM | 1 TB SSD", offset: 14000 },
    ],
  },
  laptop: {
    label: "Configuration (RAM & SSD)",
    baseKey: "8/512",
    options: [
      { key: "8/512", label: "8 GB RAM | 512 GB SSD", offset: 0 },
      { key: "16/1024", label: "16 GB RAM | 1 TB SSD", offset: 14000 },
    ],
  },
  television: {
    label: "Screen Size",
    baseKey: "43",
    options: [
      { key: "32", label: "32 inch", offset: -8000 },
      { key: "43", label: "43 inch", offset: 0 },
      { key: "55", label: "55 inch", offset: 15000 },
    ],
  },
  apparel: {
    label: "Size",
    baseKey: "M",
    options: [
      { key: "S", label: "S", offset: -50, minPrice: 99 },
      { key: "M", label: "M", offset: 0 },
      { key: "L", label: "L", offset: 0 },
      { key: "XL", label: "XL", offset: 100 },
      { key: "XXL", label: "XXL", offset: 200 },
    ],
  },
  footwear: {
    label: "Size (UK/India)",
    baseKey: "6",
    options: [
      { key: "6", label: "UK 6", offset: 0 },
      { key: "7", label: "UK 7", offset: 0 },
      { key: "8", label: "UK 8", offset: 100 },
      { key: "9", label: "UK 9", offset: 150 },
      { key: "10", label: "UK 10", offset: 200 },
    ],
  },
};

const formatINR = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatReturnDate(value) {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
}

function formatReturnDateTime(value) {
  const date = parseDate(value);
  return date
    ? date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date unavailable";
}

function addBusinessDays(value, businessDays) {
  const date = parseDate(value);
  if (!date) return null;

  let daysAdded = 0;
  while (daysAdded < businessDays) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) daysAdded += 1;
  }
  date.setHours(23, 59, 59, 999);
  return date;
}

function getOrderItemKey(item, index) {
  return String(item.id ?? index);
}

function getExchangeProductName(product) {
  return String(
    product?.product_name || product?.name || product?.title || "Product"
  )
    .split(" — ")[0]
    .trim();
}

function getProductCategory(product) {
  return String(
    product?.product_category ||
      product?.category_name ||
      product?.category?.name ||
      ""
  ).trim();
}

function getReturnWindowDays(item) {
  const category = String(
    item.product_category || item.category || item.product?.category?.name || ""
  ).toLowerCase();
  const name = String(item.product_name || "").toLowerCase();
  return /\b(electronics?|mobiles?|smartphones?|appliances?|laptops?|tablets?|televisions?|tvs?)\b/.test(
    `${category} ${name}`
  )
    ? 7
    : 10;
}

function getExchangeVariantConfig(product) {
  const category = String(
    product?.product_category ||
      product?.category_name ||
      product?.category?.name ||
      product?.category ||
      ""
  ).toLowerCase();
  const name = String(
    product?.product_name || product?.name || product?.title || ""
  ).toLowerCase();
  const text = `${category} ${name}`.replace(/[-_]/g, " ");
  const isMobileOrTablet =
    /\b(mobiles?|mobile phones?|smartphones?|smart phones?|phones?|tablets?|ipad|iphone)\b/.test(
      text
    );
  const isLaptopCategory = /\blaptops?\b/.test(category);
  const isLaptopName =
    /\b(laptop|macbook|thinkpad|galaxy\s+book|book\s*4|vivobook|ideapad|zenbook|pavilion|inspiron|latitude|rog|tuf|ultrabook|victus)\b/.test(
      name
    );
  let type = "";

  if (/\b(washing machines?|front load|top load|semi automatic|fully automatic|washers?|refrigerator|fridge|frost free|single door|double door)\b/.test(text)) {
    return null;
  }
  if (/\biphone\b/.test(name)) type = "iphone";
  else if (/\b(s26|galaxy s26)\b/.test(name)) type = "s26";
  else if (!isMobileOrTablet && /\bgalaxy\s+book\b/.test(name)) type = "galaxyBook";
  else if (!isMobileOrTablet && (isLaptopCategory || isLaptopName)) {
    type = "laptop";
  } else if (/\b(tvs?|televisions?|bravia|qled|oled|uhd|smart tv)\b/.test(text)) {
    type = "television";
  } else if (/\b(shoes?|sneakers?|footwear|sandals?|slippers?)\b/.test(text)) {
    type = "footwear";
  } else if (
    /\b(clothing|fashion|apparel|women|men|kids|children)\b/.test(category) ||
    /\b(shirts?|t shirts?|tshirts?|kurtas?|dresses|jeans|hoodies|jackets)\b/.test(name)
  ) {
    type = "apparel";
  } else if (
    /\b(mobiles?|smartphones?|smart phone|tablets?)\b/.test(category) ||
    /\b(mobile phone|smartphone|smart phone|samsung|iqoo|oneplus|xiaomi|redmi|realme|oppo|vivo)\b/.test(name)
  ) {
    type = "mobile";
  }

  const definition = EXCHANGE_VARIANT_DEFINITIONS[type];
  if (!definition) return null;

  const baseKey = getExchangeBaseKey(product, type, definition);
  return { ...definition, type, baseKey };
}

function getExchangeBaseKey(product, type, definition) {
  const title = String(
    product?.product_name || product?.name || product?.title || ""
  );
  let titleKey = "";

  if (type === "iphone") {
    titleKey = title.match(/\b(128|256|512)\s*gb\b/i)?.[1] || "";
  } else if (type === "mobile" || type === "s26") {
    const ram = title.match(/\b(8|12)\s*gb\s*ram\b/i)?.[1];
    const storage = title.match(/\b(128|256|512)\s*gb\b(?!\s*ram)/i)?.[1];
    if (type === "s26") {
      titleKey = storage ? `12/${storage}` : "";
    } else if (ram && storage) {
      titleKey = `${ram}/${storage}`;
    }
  } else if (type === "laptop" || type === "galaxyBook") {
    const ram = title.match(/\b(8|16)\s*gb\s*ram\b/i)?.[1];
    const storage = title.match(/\b(512|1024|1)\s*(gb|tb)\s*ssd\b/i);
    if (ram && storage) {
      titleKey = `${ram}/${storage[2].toLowerCase() === "tb" ? 1024 : storage[1]}`;
    }
  } else if (type === "television") {
    titleKey = title.match(/\b(32|43|55)\s*(?:inch|inches|")/i)?.[1] || "";
  }

  return definition.options.some((option) => option.key === titleKey)
    ? titleKey
    : definition.baseKey;
}

function getExchangeVariantPrice(product, config, selectedLabel) {
  const selected = config?.options.find((option) => option.label === selectedLabel);
  const base = config?.options.find((option) => option.key === config.baseKey);
  const price = Number(product?.price) || 0;
  if (!selected || !base) return price;
  return Math.max(selected.minPrice || 0, price + selected.offset - base.offset);
}

function getReturnEligibility(order, items, now) {
  const deliveryDate = [
    order.delivered_at,
    order.updated_at,
    order.created_at,
  ]
    .map(parseDate)
    .find(Boolean);

  const eligibleItems = items.map((item, index) => {
    const windowDays = getReturnWindowDays(item);
    const eligibleUntil = deliveryDate ? new Date(deliveryDate) : null;
    if (eligibleUntil) {
      eligibleUntil.setDate(eligibleUntil.getDate() + windowDays);
      eligibleUntil.setHours(23, 59, 59, 999);
    }
    return {
      item,
      key: getOrderItemKey(item, index),
      windowDays,
      eligibleUntil,
      isEligible: Boolean(eligibleUntil && now.getTime() <= eligibleUntil.getTime()),
    };
  });

  return {
    deliveryDate,
    items: eligibleItems,
    eligibleItems: eligibleItems.filter((entry) => entry.isEligible),
    lastEligibleDate: eligibleItems.reduce(
      (latest, entry) =>
        entry.eligibleUntil && (!latest || entry.eligibleUntil > latest)
          ? entry.eligibleUntil
          : latest,
      null
    ),
  };
}

function formatPickupAddress(value) {
  if (typeof value === "string") return value.trim();
  const parts = getAddressParts(value);
  return [
    parts.name,
    parts.street,
    [parts.city, parts.state, parts.pincode].filter(Boolean).join(", "),
    parts.phone,
  ]
    .filter(Boolean)
    .join(", ");
}

function loadStoredReturnRequest(orderId) {
  try {
    const savedRequest = window.localStorage.getItem(
      `nexora:return-request:${orderId}`
    );
    if (!savedRequest) return { request: null, error: "" };

    const request = JSON.parse(savedRequest);
    if (
      request.orderId !== String(orderId) ||
      typeof request.requestId !== "string" ||
      !parseDate(request.requestedAt) ||
      !["return", "exchange"].includes(request.actionType) ||
      typeof request.reason !== "string" ||
      !Array.isArray(request.selectedItems) ||
      !request.selectedItems.length ||
      !request.selectedItems.every(
        (item) => item && typeof item.name === "string"
      )
    ) {
      throw new Error("Saved return request has an invalid format.");
    }
    return { request, error: "" };
  } catch (error) {
    console.error("Could not load saved return request:", error);
    return {
      request: null,
      error: "The saved return request could not be loaded from this browser.",
    };
  }
}

function getStatusLabel(status) {
  if (status === "pending" || status === "confirmed") return "Order Confirmed";
  if (status === "out_for_delivery") return "Out for Delivery";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getAddressParts(value) {
  if (value && typeof value === "object") {
    return {
      name: value.full_name || value.name || value.recipient_name || "",
      phone: value.phone || value.phone_number || "",
      street: value.street || value.line || value.address_line || value.address || "",
      city: value.city || "",
      state: value.state || "",
      pincode: value.pincode || value.postal_code || value.zip || "",
      fullAddress: "",
    };
  }

  const fullAddress = String(value || "").trim();
  if (!fullAddress) {
    return { name: "", phone: "", street: "", city: "", state: "", pincode: "", fullAddress: "" };
  }

  const lines = fullAddress.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    return {
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      fullAddress,
    };
  }

  const recipient = lines[0].split(",").map((part) => part.trim());
  const addressParts = lines.slice(1).join(", ").split(",").map((part) => part.trim());
  const street = addressParts.shift() || "";
  const locality = addressParts.pop() || "";
  const pinMatch = locality.match(/(?:-\s*|\s+)(\d{5,6})$/);
  const pincode = pinMatch?.[1] || "";
  const state = locality.replace(/(?:\s*-\s*|\s+)\d{5,6}$/, "").trim();
  const city = addressParts.pop() || "";

  return {
    name: recipient[0] || "",
    phone: recipient.slice(1).join(", "),
    street,
    city,
    state,
    pincode,
    fullAddress,
  };
}

function getAmount(order, keys, fallback = 0) {
  for (const key of keys) {
    const value = order?.[key];
    if (value !== undefined && value !== null && value !== "" && typeof value !== "object") {
      const amount = Number(value);
      if (Number.isFinite(amount)) return amount;
    }
  }
  return fallback;
}

function OrderStatusBadge({ status }) {
  const badgeStatus =
    status === "pending"
      ? "confirmed"
      : status === "out_for_delivery"
        ? "shipped"
        : status;
  const isKnown = ["confirmed", "shipped", "delivered", "cancelled"].includes(badgeStatus);
  return (
    <span className={`order-status order-status--${isKnown ? badgeStatus : "default"}`}>
      <span className="order-status-dot" aria-hidden="true" />
      {getStatusLabel(status)}
    </span>
  );
}

function PaymentStatusBadge({ status, label }) {
  const isKnown = [
    "paid",
    "pending",
    "failed",
    "refunded",
    "refund-initiated",
    "cancelled",
  ].includes(status);
  return (
    <span
      className={`order-payment-status order-payment-status--${
        isKnown ? status : "default"
      }`}
    >
      <span className="order-status-dot" aria-hidden="true" />
      {label || status}
    </span>
  );
}

function ExchangeVariantPills({ config, selectedVariant, onSelect }) {
  if (!config) return null;
  return (
    <div
      className="order-exchange-variant-picker"
      role="group"
      aria-label={config.label}
    >
      <strong>{config.label}</strong>
      <div>
        {config.options.map((option) => (
          <button
            className={`order-exchange-variant-pill${
              selectedVariant === option.label ? " is-selected" : ""
            }`}
            type="button"
            key={option.key}
            aria-pressed={selectedVariant === option.label}
            onClick={() => onSelect(option.label)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReturnTrackingCard({ request, now, paymentMethod }) {
  const requestedAt = parseDate(request.requestedAt);
  const elapsed = requestedAt
    ? Math.max(0, now.getTime() - requestedAt.getTime())
    : 0;
  const isReturn = request.actionType === "return";
  const pickupDate =
    parseDate(request.pickupAt) || addBusinessDays(request.requestedAt, 1);
  const qualityCheckDate =
    parseDate(request.qualityCheckPassedAt) || addBusinessDays(request.requestedAt, 2);
  const expectedRefundDate = isReturn
    ? addBusinessDays(request.pickupAt || request.requestedAt, 5)
    : null;
  const expectedReplacementDate = !isReturn
    ? addBusinessDays(request.pickupAt || request.requestedAt, 5)
    : null;
  const realCompletedSteps =
    isReturn && expectedRefundDate && now >= expectedRefundDate
      ? 4
      : !isReturn && expectedReplacementDate && now >= expectedReplacementDate
        ? 4
        : qualityCheckDate && now >= qualityCheckDate
          ? 3
          : pickupDate && now >= pickupDate
            ? 2
            : 1;
  const demoCompletedSteps = Math.min(
    4,
    Math.floor(elapsed / RETURN_DEMO_STEP_MS) + 1
  );
  const adminStepByStatus = {
    requested: 1,
    approved: 1,
    pickup_scheduled: 2,
    picked_up: 3,
    completed: 4,
  };
  const isRejected = request.status === "rejected";
  const completedSteps = isRejected
    ? 1
    : Math.max(
        realCompletedSteps,
        demoCompletedSteps,
        adminStepByStatus[request.status] || 1
      );
  const refundComplete = isReturn && completedSteps === 4;
  const exchangeComplete = !isReturn && completedSteps === 4;
  const originalPaymentMethod =
    paymentMethod && !/cash on delivery|\bcod\b/i.test(paymentMethod)
      ? paymentMethod
      : "Original Payment Source";
  const demoCompletionDate = requestedAt
    ? new Date(requestedAt.getTime() + RETURN_DEMO_STEP_MS * 3)
    : now;
  const refundCompletedAt =
    expectedRefundDate && now >= expectedRefundDate
      ? expectedRefundDate
      : demoCompletionDate;
  const refundReferenceId =
    request.refundReferenceId ||
    `RFD-${String(request.requestId).replace(/^(RET|EXC)-/, "")}`;
  const exchangeSelection = request.exchangeSelection || null;
  const requestStatusLabel = {
    requested: "Requested",
    approved: "Approved",
    pickup_scheduled: "Pickup Scheduled",
    picked_up: "Picked Up",
    completed: "Completed",
    rejected: "Rejected",
  }[request.status] || "In Progress";
  const steps = [
    {
      label: isReturn ? "Return Requested" : "Exchange Requested",
      description: "Your request has been received.",
    },
    {
      label: "Pickup Scheduled",
      description: "Executive assigned for doorstep pickup within 24–48 hrs.",
    },
    {
      label: "Item Picked Up & Quality Check Passed",
      description: "The item was picked up and passed quality check.",
    },
    {
      label: isReturn
        ? "Refund Processed Successfully"
        : "Replacement Delivered Successfully",
      description: isReturn
        ? refundComplete
          ? `Refunded amount: ${formatINR(request.requestAmount)}`
          : `Refund of ${formatINR(request.requestAmount)} will be credited within 3–7 working days.`
        : "Replacement item out for delivery.",
    },
  ];

  return (
    <section
      className="order-panel order-return-tracking"
      aria-labelledby="return-tracking-title"
    >
      <div className="order-return-tracking-heading">
        <div>
          <h2 id="return-tracking-title">
            {isReturn ? "Return Tracking" : "Exchange Tracking"}
          </h2>
          <p>
            {isReturn
              ? "Return (Refund)"
              : "Exchange (Replacement / Size-Variant Change)"}
          </p>
        </div>
        <div className="order-return-badges">
          <span className="order-return-request-badge">{request.requestId}</span>
          {request.status && (
            <span className={`order-return-status-badge is-${request.status}`}>
              {requestStatusLabel}
            </span>
          )}
        </div>
      </div>

      <div className="order-return-request-details">
        <div>
          <span>Selected reason</span>
          <strong>{request.reason}</strong>
        </div>
        <div>
          <span>Selected item(s)</span>
          <strong>
            {request.selectedItems.map((item) => item.name).join(", ")}
          </strong>
        </div>
      </div>

      {isReturn && (
        <div className="order-refund-timeline" role="status">
          <strong>
            Automatic Refund Timeline: 3–7 working days after pickup quality check
          </strong>
          <span>
            Expected refund completion: {formatReturnDate(expectedRefundDate)}{" "}
            (+5 working days from request / pickup)
          </span>
          <span>Original payment method: {originalPaymentMethod}</span>
        </div>
      )}

      {!isReturn && exchangeSelection && (
        <div className="order-exchange-replacement">
          <div className="order-exchange-replacement-image">
            {exchangeSelection.image ? (
              <img
                src={exchangeSelection.image}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Package size={22} aria-hidden="true" />
            )}
          </div>
          <div className="order-exchange-replacement-copy">
            <span>Chosen replacement</span>
            <strong>{exchangeSelection.name}</strong>
            {exchangeSelection.variant && (
              <strong>Exchange for: {exchangeSelection.variant}</strong>
            )}
            {exchangeSelection.priceDifference > 0 ? (
              <small>
                Price difference: {formatINR(exchangeSelection.priceDifference)} payable on delivery
              </small>
            ) : (
              <small>No extra charge</small>
            )}
          </div>
        </div>
      )}

      <div
        className="order-return-steps"
        style={{
          "--return-progress": `${((completedSteps - 1) / 3) * 100}%`,
        }}
      >
        {steps.map((step, index) => {
          const isComplete = index < completedSteps;
          const isCurrent =
            index === completedSteps && completedSteps < steps.length;
          const realMilestones = [
            requestedAt,
            pickupDate,
            qualityCheckDate,
            isReturn ? expectedRefundDate : expectedReplacementDate,
          ];
          const milestoneDate =
            realCompletedSteps > index
              ? realMilestones[index]
              : requestedAt
                ? new Date(requestedAt.getTime() + index * RETURN_DEMO_STEP_MS)
                : null;

          return (
            <div
              className={`order-return-step${isComplete ? " is-complete" : ""}${
                isCurrent ? " is-current" : ""
              }`}
              key={step.label}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="order-return-step-node">
                {isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}
              </span>
              <strong>{step.label}</strong>
              <span className="order-return-step-description">{step.description}</span>
              <span className="order-return-step-time">
                {isComplete
                  ? formatReturnDateTime(milestoneDate)
                  : isCurrent && index === 1
                    ? "Pickup within 24–48 hours"
                    : isCurrent
                      ? "In progress"
                      : "Pending"}
              </span>
            </div>
          );
        })}
      </div>

      {isRejected && (
        <p className="order-return-rejected" role="status">
          This return / exchange request was rejected. Contact Nexora Support for assistance.
        </p>
      )}

      {!isReturn && completedSteps === 3 && (
        <p className="order-return-outcome">Replacement item out for delivery.</p>
      )}
      {refundComplete && (
        <div className="order-refund-success" role="status">
          <strong>Refund Processed Successfully</strong>
          <span>Refunded Amount: {formatINR(request.requestAmount)}</span>
          <span>
            Credited to: {originalPaymentMethod} (within 3–7 working days)
          </span>
          <span>Refund Reference ID: {refundReferenceId}</span>
          <span>Completed: {formatReturnDateTime(refundCompletedAt)}</span>
        </div>
      )}
      {exchangeComplete && (
        <div className="order-exchange-success" role="status">
          <strong>Replacement Delivered Successfully</strong>
          {exchangeSelection?.variant && (
            <span>Exchange for: {exchangeSelection.variant}</span>
          )}
          {exchangeSelection?.name && <span>{exchangeSelection.name}</span>}
        </div>
      )}
      <p className="order-return-demo-note">
        Demo tracking advances automatically every 30 seconds. Request status is saved to your Nexora order.
      </p>
    </section>
  );
}

function OrderDetailsContent({ id }) {
  const navigate = useNavigate();
  const now = useOrderTrackingNow();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [returnState, setReturnState] = useState(() => loadStoredReturnRequest(id));
  const returnRequest = returnState.request;
  const setReturnRequest = (request) =>
    setReturnState((previous) => ({ ...previous, request }));
  const returnError = returnState.error;
  const setReturnError = (message) =>
    setReturnState((previous) => ({ ...previous, error: message }));
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnNow, setReturnNow] = useState(() => new Date());
  const [returnForm, setReturnForm] = useState({
    actionType: "return",
    selectedItemIds: [],
    reason: "",
    note: "",
    pickupAddress: "",
  });
  const [exchangeMode, setExchangeMode] = useState("same_product");
  const [exchangeVariant, setExchangeVariant] = useState("");
  const [replacementProduct, setReplacementProduct] = useState(null);
  const [replacementVariant, setReplacementVariant] = useState("");
  const [replacementSearch, setReplacementSearch] = useState("");
  const [replacementProducts, setReplacementProducts] = useState([]);
  const [replacementProductsLoading, setReplacementProductsLoading] =
    useState(false);
  const [replacementProductsError, setReplacementProductsError] = useState("");
  const [replacementFetchAttempt, setReplacementFetchAttempt] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    let active = true;

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}/`);
        const loadedOrder = response.data.order || response.data;
        if (active) {
          setOrder(loadedOrder);
          if (loadedOrder.return_request) {
            setReturnState({ request: loadedOrder.return_request, error: "" });
            try {
              window.localStorage.setItem(
                `nexora:return-request:${loadedOrder.id}`,
                JSON.stringify(loadedOrder.return_request)
              );
            } catch (storageError) {
              console.warn("Could not cache the server return request locally:", storageError);
            }
          }
        }
      } catch (err) {
        console.error("Load order error:", err.response?.data || err.message);
        if (active) {
          setError(err.response?.data?.detail || "Failed to load order.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!returnRequest) return undefined;
    const timer = window.setInterval(() => setReturnNow(new Date()), 5000);
    return () => window.clearInterval(timer);
  }, [returnRequest]);

  useEffect(() => {
    if (
      !showReturnModal ||
      returnForm.actionType !== "exchange" ||
      exchangeMode !== "another_product"
    ) {
      return undefined;
    }

    let active = true;
    const fetchReplacementProducts = async () => {
      try {
        const payload = await getCachedProducts(api);
        if (active) {
          if (!Array.isArray(payload)) {
            setReplacementProductsError(
              "Replacement products returned an unexpected response. Please try again."
            );
          } else {
            setReplacementProducts(payload);
          }
        }
      } catch (fetchError) {
        console.error(
          "Could not load replacement products:",
          fetchError.response?.data || fetchError.message
        );
        if (active) {
          setReplacementProductsError(
            "Replacement products could not be loaded. Please try again."
          );
        }
      } finally {
        if (active) setReplacementProductsLoading(false);
      }
    };

    fetchReplacementProducts();
    return () => {
      active = false;
    };
  }, [
    showReturnModal,
    returnForm.actionType,
    exchangeMode,
    replacementFetchAttempt,
  ]);

  const handleCancelOrder = async () => {
    if (!order || cancelling || !cancellationReason) return;

    setError("");
    setCancelMessage("");
    setCancelling(true);

    try {
      const response = await api.patch(`/orders/${id}/cancel/`, {
        reason: cancellationReason,
      });
      invalidateProductsCache();
      const refreshedResponse = await api.get(`/orders/${id}/`);
      setOrder(refreshedResponse.data.order || refreshedResponse.data);
      setShowCancelModal(false);
      setCancelMessage(response.data.message || "Your order has been cancelled.");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (err) {
      console.error("Cancel order error:", err.response?.data || err.message);
      setError(
        err.response?.data?.detail ||
          "Order was cancelled, but refreshing its details failed. Please refresh the page."
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <main className="order-details-page order-page-loading">Loading order details…</main>;
  }

  if (error && !order) {
    return (
      <main className="order-details-page order-page-error" role="alert">
        <p>{error}</p>
        <Link className="order-link-button" to="/orders">
          <ArrowLeft size={15} aria-hidden="true" /> Back to My Orders
        </Link>
      </main>
    );
  }

  if (!order) {
    return <main className="order-details-page order-page-error">Order not found.</main>;
  }

  const tracking = getOrderTrackingState(order, now);
  const status = tracking.status;
  const paymentStatus = String(order.payment_status || "pending").toLowerCase();
  const orderNumber = formatOrderId(order);
  const items = Array.isArray(order.items) ? order.items : [];
  const isDeliveredOrder = String(order.status || "").toLowerCase() === "delivered";
  const returnEligibility = getReturnEligibility(order, items, now);
  const selectedExchangeEntry = returnEligibility.items.find((entry) =>
    returnForm.selectedItemIds.includes(entry.key)
  );
  const selectedExchangeItem = selectedExchangeEntry?.item || null;
  const sameProduct = selectedExchangeItem
    ? {
        name: getExchangeProductName(selectedExchangeItem),
        product_category: getProductCategory(selectedExchangeItem),
        price: selectedExchangeItem.price,
        image:
          selectedExchangeItem.product_image ||
          selectedExchangeItem.image ||
          selectedExchangeItem.product?.image,
      }
    : null;
  const sameProductVariantConfig = getExchangeVariantConfig(sameProduct);
  const replacementVariantConfig = getExchangeVariantConfig(replacementProduct);
  const sourceUnitPrice = Number(selectedExchangeItem?.price) || 0;
  const replacementUnitPrice =
    replacementVariantConfig && replacementVariant
      ? getExchangeVariantPrice(
          replacementProduct,
          replacementVariantConfig,
          replacementVariant
        )
      : Number(replacementProduct?.price) || 0;
  const replacementPriceDifference =
    Math.max(0, replacementUnitPrice - sourceUnitPrice) *
    (Number(selectedExchangeItem?.quantity) || 1);
  const replacementSearchTerm = replacementSearch.trim().toLowerCase();
  const sourceCategoryName = getProductCategory(selectedExchangeItem).toLowerCase();
  const sourceProductId =
    selectedExchangeItem?.product?.id ?? selectedExchangeItem?.product;
  const filteredReplacementProducts = replacementProducts
    .filter(
      (product) =>
        product.is_active !== false &&
        (!sourceProductId || String(product.id) !== String(sourceProductId))
    )
    .filter((product) => {
      if (!replacementSearchTerm) return true;
      return `${product.name || product.title || ""} ${getProductCategory(product)} ${
        product.brand || ""
      }`
        .toLowerCase()
        .includes(replacementSearchTerm);
    })
    .sort((left, right) => {
      const getScore = (product) => {
        const sameCategory =
          sourceCategoryName &&
          getProductCategory(product).toLowerCase() === sourceCategoryName;
        const priceDistance =
          Math.abs((Number(product.price) || 0) - sourceUnitPrice) /
          Math.max(sourceUnitPrice, 1);
        return (sameCategory ? 0 : 2) + Math.min(priceDistance, 1);
      };
      return getScore(left) - getScore(right);
    });
  const canCancel = ["pending", "confirmed"].includes(status);
  const address = getAddressParts(order.shipping_address);
  const itemSubtotal = getAmount(
    order,
    ["item_subtotal", "items_subtotal", "subtotal"],
    items.reduce(
      (total, item) =>
        total +
        (Number(item.subtotal) ||
          Number(item.price || 0) * Number(item.quantity || 0)),
      0
    )
  );
  const shippingFee = getAmount(
    order,
    ["shipping_fee", "shipping_cost", "delivery_fee", "shipping_amount"],
    0
  );
  const taxAmount = getAmount(order, ["tax_amount", "tax"]);
  const discountAmount = getAmount(order, ["discount_amount", "discount"]);
  const hasTax = order.tax_amount != null || order.tax != null;
  const hasDiscount = order.discount_amount != null || order.discount != null;
  const paymentInfo = tracking.paymentInfo;
  const refundTracking = getRefundTrackingState(order, now);
  const canPayNow =
    paymentStatus === "pending" &&
    !["cancelled", "delivered"].includes(status) &&
    !paymentInfo.isCod;
  const paymentBadgeStatus =
    refundTracking.isCancelled
      ? refundTracking.paymentBadgeStatus
      : paymentInfo.paymentLabel === "Paid"
        ? "paid"
        : paymentInfo.isCod
          ? "pending"
          : paymentStatus;
  const paymentStatusLabel = refundTracking.isCancelled
    ? refundTracking.paymentStatusLabel
    : paymentInfo.paymentLabel;
  const stepTimestamps = [
    order.confirmed_at || order.created_at,
    order.shipped_at,
    order.out_for_delivery_at,
    order.delivered_at ||
      (status === "delivered" ? tracking.expectedDeliveryDate : null),
  ];
  const cancellationSteps = refundTracking.isPaidOnline
    ? [
        {
          label: "Order Placed",
          timestamp: refundTracking.orderPlacedDateLabel,
          complete: true,
        },
        {
          label: "Order Cancelled",
          timestamp: refundTracking.cancellationDateLabel,
          complete: true,
        },
        {
          label: refundTracking.refundStatusLabel,
          timestamp: `Expected by ${refundTracking.expectedRefundDateLabel || "date to be confirmed"}`,
          complete: refundTracking.refunded,
          current: !refundTracking.refunded,
        },
      ]
    : [
        {
          label: "Order Placed",
          timestamp: refundTracking.orderPlacedDateLabel,
          complete: true,
        },
        {
          label: "Order Cancelled",
          timestamp: refundTracking.cancellationDateLabel,
          complete: true,
          cancelled: true,
        },
      ];

  const handleOpenReturnModal = () => {
    setReturnError("");
    setExchangeMode("same_product");
    setExchangeVariant("");
    setReplacementProduct(null);
    setReplacementVariant("");
    setReplacementSearch("");
    setReturnForm({
      actionType: "return",
      selectedItemIds: returnEligibility.eligibleItems.map((entry) => entry.key),
      reason: "",
      note: "",
      pickupAddress: formatPickupAddress(order.shipping_address),
    });
    setShowReturnModal(true);
  };

  const handleExchangeModeChange = (mode) => {
    setExchangeMode(mode);
    setExchangeVariant("");
    setReplacementProduct(null);
    setReplacementVariant("");
    setReplacementSearch("");
    setReplacementProductsError("");
    setReplacementProductsLoading(mode === "another_product");
  };

  const handleReturnRequestSubmit = async (event) => {
    event.preventDefault();
    setReturnError("");

    if (!isDeliveredOrder) {
      setReturnError("Return or exchange requests are only available for delivered orders.");
      return;
    }

    const currentEligibility = getReturnEligibility(order, items, new Date());
    const selectedEntries = currentEligibility.eligibleItems.filter((entry) =>
      returnForm.selectedItemIds.includes(entry.key)
    );
    if (!selectedEntries.length) {
      setReturnError("Select at least one item that is still within its return window.");
      return;
    }
    if (returnForm.actionType === "exchange" && selectedEntries.length !== 1) {
      setReturnError("Select one item per exchange request.");
      return;
    }
    if (!returnForm.reason) {
      setReturnError("Select a reason for your request.");
      return;
    }
    if (!returnForm.pickupAddress.trim()) {
      setReturnError("Enter a pickup address for this request.");
      return;
    }

    let exchangeSelection = null;
    if (returnForm.actionType === "exchange") {
      const sourceItem = selectedEntries[0].item;
      const sourceProduct = {
        product_name: sourceItem.product_name,
        product_category: getProductCategory(sourceItem),
        price: sourceItem.price,
        image:
          sourceItem.product_image ||
          sourceItem.image ||
          sourceItem.product?.image,
      };

      if (exchangeMode === "same_product") {
        const config = getExchangeVariantConfig(sourceProduct);
        if (!config) {
          setReturnError("This product has no size or variant options for an exchange.");
          return;
        }
        if (!exchangeVariant) {
          setReturnError("Choose the new size or variant for this exchange.");
          return;
        }
        exchangeSelection = {
          mode: exchangeMode,
          name: getExchangeProductName(sourceProduct),
          image: sourceProduct.image || "",
          variant: exchangeVariant,
          variantLabel: config.label,
          priceDifference: 0,
        };
      } else {
        if (!replacementProduct) {
          setReturnError("Choose a replacement product.");
          return;
        }
        const config = getExchangeVariantConfig(replacementProduct);
        if (config && !replacementVariant) {
          setReturnError(`Choose a ${config.label.toLowerCase()} for the replacement product.`);
          return;
        }
        const replacementPrice = config
          ? getExchangeVariantPrice(
              replacementProduct,
              config,
              replacementVariant
            )
          : Number(replacementProduct.price) || 0;
        const sourcePrice = Number(sourceItem.price) || 0;
        const quantity = Number(sourceItem.quantity) || 1;
        exchangeSelection = {
          mode: exchangeMode,
          productId: String(replacementProduct.id),
          name: getExchangeProductName(replacementProduct),
          image: replacementProduct.image || "",
          variant: replacementVariant,
          variantLabel: config?.label || "",
          unitPrice: replacementPrice,
          priceDifference:
            Math.max(0, replacementPrice - sourcePrice) * quantity,
        };
      }
    }

    setSubmittingReturn(true);
    try {
      const response = await api.post(`/orders/${order.id}/return-request/`, {
        action_type: returnForm.actionType,
        reason: returnForm.reason,
        note: returnForm.note.trim(),
        pickup_address: returnForm.pickupAddress.trim(),
        selected_item_ids: selectedEntries.map(({ item, key }) => item.id ?? key),
        exchange_selection: exchangeSelection,
      });
      const request = response.data;
      try {
        window.localStorage.setItem(
          `nexora:return-request:${order.id}`,
          JSON.stringify(request)
        );
      } catch (storageError) {
        console.warn("Could not cache the server return request locally:", storageError);
      }
      setReturnRequest(request);
      setReturnNow(new Date(request.requestedAt));
      setShowReturnModal(false);
    } catch (requestError) {
      console.error(
        "Could not submit return or exchange request:",
        requestError.response?.data || requestError
      );
      const responseData = requestError.response?.data;
      const firstFieldError =
        responseData && typeof responseData === "object"
          ? Object.values(responseData).flat().find(Boolean)
          : null;
      setReturnError(
        responseData?.detail ||
          (typeof firstFieldError === "string" ? firstFieldError : "") ||
          "Your return or exchange request could not be submitted. Please try again."
      );
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <main className="order-details-page">
      <Link className="order-back-link" to="/orders">
        <ArrowLeft size={16} aria-hidden="true" /> Back to My Orders
      </Link>

      <header className="order-details-topline">
        <div>
          <h1 className="order-details-heading">Order ID: {orderNumber}</h1>
          <div className="order-details-subline">
            <span>
              Order placed{" "}
              <strong>
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "Date unavailable"}
              </strong>
            </span>
            <OrderStatusBadge status={status} />
          </div>
        </div>
        {canPayNow && (
          <button
            className="order-action-button order-action-button--primary"
            type="button"
            onClick={() =>
              navigate("/payment", {
                state: {
                  orderId: order.id,
                  orderNumber: order.order_number,
                },
              })
            }
          >
            Pay Now
          </button>
        )}
      </header>

      {cancelMessage && (
        <div className="order-feedback order-feedback--success" role="status">
          {cancelMessage}
        </div>
      )}
      {error && (
        <div className="order-feedback order-feedback--error" role="alert">
          {error}
        </div>
      )}

      <div className="order-details-layout">
        <div className="order-details-main">
          <section className="order-panel order-items-panel">
            <h2 className="order-panel-heading">
              <span>Items Ordered</span>
              <span>{items.length} {items.length === 1 ? "item" : "items"}</span>
            </h2>
            {items.length ? (
              <div className="order-items-list">
                {items.map((item) => {
                  const productId =
                    typeof item.product === "object" ? item.product?.id : item.product;
                  const productPath = productId ? `/products/${productId}` : "/products";
                  const image = item.product_image || item.image || item.product?.image;
                  const quantity = Number(item.quantity) || 0;
                  const unitPrice = Number(item.price) || 0;
                  const subtotal = Number(item.subtotal) || unitPrice * quantity;

                  return (
                    <article className="order-detail-item" key={item.id}>
                      <Link
                        className="order-detail-thumb"
                        to={productPath}
                        aria-label={`View ${item.product_name || "product"}`}
                      >
                        <Package className="order-detail-fallback" size={27} aria-hidden="true" />
                        {image && (
                          <img
                            src={image}
                            alt={item.product_name || "Product"}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </Link>
                      <div>
                        <h3 className="order-detail-name">
                          <Link to={productPath}>{item.product_name || "Product"}</Link>
                        </h3>
                        <div className={`order-delivery-label order-delivery-label--${tracking.tone}`}>
                          <span className="order-status-dot" aria-hidden="true" />
                          {tracking.deliveryMessage}
                        </div>
                        <div className="order-detail-meta">
                          <span className="order-quantity">Qty {quantity}</span>
                          {item.size && <span>Size: {item.size}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                        <p className="order-detail-unit">Unit price {formatINR(unitPrice)}</p>
                      </div>
                      <strong className="order-detail-subtotal">{formatINR(subtotal)}</strong>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="order-address-content" style={{ padding: "18px 20px" }}>
                No order items were returned.
              </p>
            )}
          </section>

          {status === "cancelled" ? (
            <section
              className="order-panel order-tracking-panel refund-tracking-panel"
              id="order-tracking"
            >
              <div className="order-tracking-heading">
                <h2 className="order-tracking-title">Cancellation &amp; Refund Tracking</h2>
                <OrderStatusBadge status="cancelled" />
              </div>
              <div
                className={`order-refund-notice order-refund-notice--${
                  refundTracking.isPaidOnline
                    ? refundTracking.refunded
                      ? "refunded"
                      : "initiated"
                    : "no-charge"
                }`}
                role="status"
              >
                {refundTracking.notice}
                {refundTracking.isPaidOnline && refundTracking.expectedRefundDateLabel && (
                  <strong>
                    Expected refund date: {refundTracking.expectedRefundDateLabel}
                  </strong>
                )}
              </div>
              <div
                className={`order-tracking-steps refund-tracking-steps refund-tracking-steps--${
                  refundTracking.isPaidOnline ? "three" : "two"
                }`}
                style={{
                  "--refund-progress":
                    refundTracking.isPaidOnline && !refundTracking.refunded ? "50%" : "100%",
                }}
              >
                {cancellationSteps.map((step, index) => (
                  <div
                    className={`order-tracking-step${step.complete ? " is-complete" : ""}${
                      step.current ? " is-current" : ""
                    }${step.cancelled ? " refund-step--cancelled" : ""}`}
                    key={step.label}
                    aria-current={step.current ? "step" : undefined}
                  >
                    <span className="order-tracking-node">
                      {step.complete ? <Check size={14} aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="order-tracking-step-label">{step.label}</span>
                    <span className="order-tracking-step-time">{step.timestamp}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="order-panel order-tracking-panel" id="order-tracking">
              <div className="order-tracking-heading">
                <h2 className="order-tracking-title">Order tracking</h2>
                <div className={`order-delivery-label order-delivery-label--${tracking.tone}`}>
                  <span className="order-status-dot" aria-hidden="true" />
                  {tracking.deliveryMessage}
                </div>
              </div>
              <div
                className="order-tracking-steps"
                style={{
                  "--order-progress": `${
                    ((tracking.completedSteps - 1) / (ORDER_STEPS.length - 1)) * 100
                  }%`,
                }}
              >
                {ORDER_STEPS.map((label, index) => {
                  const isComplete = index < tracking.completedSteps;
                  const isCurrent =
                    index === tracking.completedSteps &&
                    tracking.completedSteps < ORDER_STEPS.length;
                  return (
                    <div
                      className={`order-tracking-step${isComplete ? " is-complete" : ""}${
                        isCurrent ? " is-current" : ""
                      }`}
                      key={label}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className="order-tracking-node">
                        {isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}
                      </span>
                      <span className="order-tracking-step-label">{label}</span>
                      <span className="order-tracking-step-time">
                        {stepTimestamps[index]
                          ? new Date(stepTimestamps[index]).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : isComplete
                            ? "Complete"
                            : isCurrent
                              ? "In progress"
                              : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {isDeliveredOrder && (
            returnRequest ? (
              <ReturnTrackingCard
                request={returnRequest}
                now={returnNow}
                paymentMethod={paymentInfo.methodLabel}
              />
            ) : (
              <section className="order-panel order-return-option" aria-labelledby="return-option-title">
                <div className="order-return-option-heading">
                  <div className="order-return-option-title">
                    <RotateCcw size={19} aria-hidden="true" />
                    <h2 id="return-option-title">Need a return or exchange?</h2>
                  </div>
                  {returnEligibility.eligibleItems.length > 0 && (
                    <span className="order-return-eligibility">
                      Return / Exchange eligible till{" "}
                      {formatReturnDate(
                        returnEligibility.eligibleItems.reduce(
                          (latest, entry) =>
                            !latest || entry.eligibleUntil > latest
                              ? entry.eligibleUntil
                              : latest,
                          null
                        )
                      )}
                    </span>
                  )}
                </div>
                <p>
                  Select the delivered item(s) and tell us how we can help. Pickup will be arranged from your delivery address.
                </p>
                {returnEligibility.eligibleItems.length > 0 ? (
                  <button
                    className="order-action-button order-action-button--primary"
                    type="button"
                    onClick={handleOpenReturnModal}
                  >
                    Return / Exchange Item
                  </button>
                ) : (
                  <p className="order-return-closed" role="status">
                    {returnEligibility.lastEligibleDate
                      ? `Return window closed on ${formatReturnDate(returnEligibility.lastEligibleDate)}.`
                      : "Return eligibility could not be calculated for this order."}
                  </p>
                )}
                {returnError && (
                  <p className="order-return-error" role="alert">{returnError}</p>
                )}
              </section>
            )
          )}
          {status !== "cancelled" && (
            <section className="order-cancel-card">
              <h2>Need to cancel this order?</h2>
              <p>You can cancel while the order is pending or confirmed.</p>
              <button
                className="order-action-button"
                type="button"
                onClick={() => {
                  setCancellationReason("");
                  setShowCancelModal(true);
                }}
                disabled={cancelling || !canCancel}
              >
                Cancel Order
              </button>
            </section>
          )}
        </div>

        <aside className="order-details-sidebar" aria-label="Order summary">
          <section className="order-panel order-info-card">
            <h2><MapPin size={17} aria-hidden="true" /> Shipping Address</h2>
            {address.name && <p className="order-address-name">{address.name}</p>}
            {(address.street || address.city || address.state || address.pincode) ? (
              <p className="order-address-content">
                {[address.street, [address.city, address.state].filter(Boolean).join(", "), address.pincode]
                  .filter(Boolean)
                  .join("\n")}
              </p>
            ) : (
              <p className="order-address-content">{address.fullAddress || "No shipping address available."}</p>
            )}
            {address.phone && <p className="order-address-content" style={{ marginTop: 8 }}>{address.phone}</p>}
          </section>

          <section className="order-panel order-info-card">
            <h2><CreditCard size={17} aria-hidden="true" /> Payment Information</h2>
            <div className="order-info-row">
              <span>Payment method</span><strong>{paymentInfo.methodLabel}</strong>
            </div>
            {paymentInfo.paymentId && (
              <div className="order-info-row">
                <span>Payment ID</span><strong className="order-payment-id">{paymentInfo.paymentId}</strong>
              </div>
            )}
            <div className="order-info-row">
              <span>Payment status</span>
              <PaymentStatusBadge status={paymentBadgeStatus} label={paymentStatusLabel} />
            </div>
            {refundTracking.isCancelled && (
              <div
                className={`order-refund-notice order-refund-notice--${
                  refundTracking.isPaidOnline
                    ? refundTracking.refunded
                      ? "refunded"
                      : "initiated"
                    : "no-charge"
                }`}
                role="status"
              >
                {refundTracking.notice}
                {refundTracking.isPaidOnline && refundTracking.expectedRefundDateLabel && (
                  <strong>
                    Expected refund date: {refundTracking.expectedRefundDateLabel}
                  </strong>
                )}
              </div>
            )}
          </section>

          <section className="order-panel order-info-card">
            <h2><ShieldCheck size={17} aria-hidden="true" /> Price Summary</h2>
            <div className="order-info-row">
              <span>Listing / item price</span><strong>{formatINR(itemSubtotal)}</strong>
            </div>
            <div className="order-info-row">
              <span>Delivery charges</span>
              <strong>{shippingFee === 0 ? "Free" : formatINR(shippingFee)}</strong>
            </div>
            {hasTax && (
              <div className="order-info-row">
                <span>Tax</span><strong>{formatINR(taxAmount)}</strong>
              </div>
            )}
            {hasDiscount && (
              <div className="order-info-row">
                <span>Discount</span><strong>−{formatINR(discountAmount)}</strong>
              </div>
            )}
            <div className="order-info-row order-price-total">
              <span>Total amount</span><strong>{formatINR(order.total_amount)}</strong>
            </div>
          </section>

          {status !== "cancelled" && status !== "delivered" && (
            <section className="order-panel order-info-card">
              <h2><Truck size={17} aria-hidden="true" /> Delivery update</h2>
              <p className="order-address-content">
                {status === "shipped"
                  ? "Your order is on its way."
                  : "We’ll update your delivery progress as your order moves through fulfillment."}
              </p>
            </section>
          )}
        </aside>
      </div>

      {showCancelModal && (
        <div
          className="order-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCancelModal(false);
          }}
        >
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
          >
            <h2 id="cancel-order-title">Cancel this order?</h2>
            <p>
              Are you sure you want to cancel <strong>{orderNumber}</strong>? Please select a reason.
            </p>
            <label htmlFor="cancel-reason">Reason for cancellation</label>
            <select
              id="cancel-reason"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
            >
              <option value="">Choose a reason</option>
              <option value="ordered_by_mistake">Ordered by mistake</option>
              <option value="found_better_price">Found a better price</option>
              <option value="delivery_too_late">Delivery is taking too long</option>
              <option value="wrong_product">Ordered the wrong product</option>
              <option value="payment_issue">Payment issue</option>
              <option value="changed_mind">Changed my mind</option>
              <option value="other">Other reason</option>
            </select>
            <div className="order-modal-actions">
              <button
                className="order-action-button"
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                className="order-action-button order-action-button--primary"
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling || !cancellationReason}
              >
                {cancelling ? "Cancelling…" : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showReturnModal && (
        <div
          className="order-modal-backdrop order-return-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowReturnModal(false);
          }}
        >
          <form
            className="order-modal order-return-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-modal-title"
            onSubmit={handleReturnRequestSubmit}
          >
            <div className="order-return-modal-heading">
              <div>
                <h2 id="return-modal-title">Return / Exchange Item</h2>
                <p>Request a pickup for order {orderNumber}.</p>
              </div>
              <button
                className="order-return-close"
                type="button"
                aria-label="Close return request"
                onClick={() => setShowReturnModal(false)}
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <fieldset className="order-return-action-types">
              <legend>Action Type</legend>
              <label>
                <input
                  type="radio"
                  name="return-action-type"
                  value="return"
                  checked={returnForm.actionType === "return"}
                  onChange={() => {
                    setReturnForm((previous) => ({
                      ...previous,
                      actionType: "return",
                    }));
                  }}
                />
                <span>
                  <strong>Return (Refund)</strong>
                  <small>Get a refund for the selected item(s).</small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="return-action-type"
                  value="exchange"
                  checked={returnForm.actionType === "exchange"}
                  onChange={() => {
                    setReturnForm((previous) => ({
                      ...previous,
                      actionType: "exchange",
                      selectedItemIds: previous.selectedItemIds.slice(0, 1),
                    }));
                    setExchangeMode("same_product");
                    setExchangeVariant("");
                    setReplacementProduct(null);
                    setReplacementVariant("");
                    setReplacementSearch("");
                    setReplacementProductsLoading(false);
                  }}
                />
                <span>
                  <strong>Exchange</strong>
                  <small>Request a replacement or size/variant change.</small>
                </span>
              </label>
            </fieldset>

            <fieldset className="order-return-items">
              <legend>Select Item(s)</legend>
              {returnEligibility.items.map(({ item, key, eligibleUntil, isEligible }) => (
                <label
                  className={`order-return-item${isEligible ? "" : " is-disabled"}`}
                  key={key}
                >
                  <input
                    type="checkbox"
                    checked={returnForm.selectedItemIds.includes(key)}
                    disabled={!isEligible}
                    onChange={(event) => {
                      if (returnForm.actionType === "exchange") {
                        setExchangeVariant("");
                        setReplacementProduct(null);
                        setReplacementVariant("");
                        setReturnForm((previous) => ({
                          ...previous,
                          selectedItemIds: event.target.checked ? [key] : [],
                        }));
                        return;
                      }
                      setReturnForm((previous) => ({
                        ...previous,
                        selectedItemIds: event.target.checked
                          ? [...previous.selectedItemIds, key]
                          : previous.selectedItemIds.filter(
                              (selectedId) => selectedId !== key
                            ),
                      }));
                    }}
                  />
                  <span className="order-return-item-copy">
                    <strong>{item.product_name || "Product"}</strong>
                    <small>
                      Qty {Number(item.quantity) || 1} ·{" "}
                      {formatINR(
                        Number(item.subtotal) ||
                          (Number(item.price) || 0) * (Number(item.quantity) || 1)
                      )}
                    </small>
                  </span>
                  <span className="order-return-item-window">
                    {isEligible
                      ? `Eligible till ${formatReturnDate(eligibleUntil)}`
                      : `Window closed ${formatReturnDate(eligibleUntil)}`}
                  </span>
                </label>
              ))}
            </fieldset>

            {returnForm.actionType === "exchange" && (
              <section className="order-exchange-options" aria-label="Exchange options">
                <h3>Choose Exchange Option</h3>
                <p className="order-exchange-selection-note">
                  Exchange requests are submitted one order item at a time.
                </p>
                <div className="order-exchange-modes">
                  <label className={!sameProductVariantConfig ? "is-disabled" : ""}>
                    <input
                      type="radio"
                      name="exchange-mode"
                      value="same_product"
                      checked={exchangeMode === "same_product"}
                      disabled={!sameProductVariantConfig}
                      onChange={() => handleExchangeModeChange("same_product")}
                    />
                    <span>
                      <strong>Change Size / Variant (Same Product)</strong>
                      <small>
                        {sameProductVariantConfig
                          ? "Choose a new size or configuration."
                          : "No size or variant options are available for this item."}
                      </small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="exchange-mode"
                      value="another_product"
                      checked={exchangeMode === "another_product"}
                      onChange={() => handleExchangeModeChange("another_product")}
                    />
                    <span>
                      <strong>Exchange for Another Product</strong>
                      <small>Choose a replacement from the Nexora catalogue.</small>
                    </span>
                  </label>
                </div>

                {exchangeMode === "same_product" && sameProductVariantConfig && (
                  <ExchangeVariantPills
                    config={sameProductVariantConfig}
                    selectedVariant={exchangeVariant}
                    onSelect={setExchangeVariant}
                  />
                )}

                {exchangeMode === "another_product" && (
                  <div className="order-replacement-picker">
                    <label htmlFor="replacement-product-search">
                      Search replacement products
                      <input
                        id="replacement-product-search"
                        type="search"
                        value={replacementSearch}
                        onChange={(event) => setReplacementSearch(event.target.value)}
                        placeholder="Search by product or category"
                      />
                    </label>
                    <p className="order-replacement-hint">
                      Products in the same category and price range are shown first.
                    </p>
                    {replacementProductsLoading && (
                      <p className="order-replacement-state" role="status">
                        Loading replacement products…
                      </p>
                    )}
                    {replacementProductsError && (
                      <div className="order-replacement-error" role="alert">
                        <span>{replacementProductsError}</span>
                        <button
                          className="order-action-button"
                          type="button"
                          onClick={() => {
                            setReplacementProductsError("");
                            setReplacementProductsLoading(true);
                            setReplacementFetchAttempt((attempt) => attempt + 1);
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {!replacementProductsLoading &&
                      !replacementProductsError &&
                      (filteredReplacementProducts.length ? (
                        <div className="order-replacement-product-list">
                          {filteredReplacementProducts.map((product) => {
                            const isSelected =
                              String(replacementProduct?.id) === String(product.id);
                            return (
                              <button
                                className={`order-replacement-product${
                                  isSelected ? " is-selected" : ""
                                }`}
                                type="button"
                                key={product.id}
                                aria-pressed={isSelected}
                                onClick={() => {
                                  setReplacementProduct(product);
                                  setReplacementVariant("");
                                }}
                              >
                                <span className="order-replacement-image">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt=""
                                      onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <Package size={20} aria-hidden="true" />
                                  )}
                                </span>
                                <span className="order-replacement-product-copy">
                                  <strong>{product.name || product.title || "Product"}</strong>
                                  <small>{getProductCategory(product) || "Nexora product"}</small>
                                  <b>{formatINR(product.price)}</b>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="order-replacement-state">
                          No products match this search.
                        </p>
                      ))}

                    {replacementProduct && (
                      <div className="order-replacement-selected">
                        <strong>
                          Selected: {getExchangeProductName(replacementProduct)}
                        </strong>
                        {replacementVariantConfig ? (
                          <ExchangeVariantPills
                            config={replacementVariantConfig}
                            selectedVariant={replacementVariant}
                            onSelect={setReplacementVariant}
                          />
                        ) : (
                          <span>This product has no selectable size or variant.</span>
                        )}
                        {(!replacementVariantConfig || replacementVariant) && (
                          <p className="order-exchange-price-note">
                            {replacementPriceDifference > 0
                              ? `Price difference: ${formatINR(replacementPriceDifference)} payable on delivery`
                              : "No extra charge"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            <label className="order-return-field" htmlFor="return-reason">
              Reason
              <select
                id="return-reason"
                required
                value={returnForm.reason}
                onChange={(event) =>
                  setReturnForm((previous) => ({
                    ...previous,
                    reason: event.target.value,
                  }))
                }
              >
                <option value="">Select a reason</option>
                {RETURN_REASONS.map((reason) => (
                  <option value={reason} key={reason}>{reason}</option>
                ))}
              </select>
            </label>

            <label className="order-return-field" htmlFor="return-note">
              Optional Note / Comments
              <textarea
                id="return-note"
                rows={3}
                maxLength={1000}
                value={returnForm.note}
                onChange={(event) =>
                  setReturnForm((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
                placeholder="Add any details that may help our team."
              />
            </label>

            <label className="order-return-field" htmlFor="return-pickup-address">
              Pickup Address
              <textarea
                id="return-pickup-address"
                rows={3}
                required
                value={returnForm.pickupAddress}
                onChange={(event) =>
                  setReturnForm((previous) => ({
                    ...previous,
                    pickupAddress: event.target.value,
                  }))
                }
              />
            </label>

            {returnError && (
              <p className="order-return-error" role="alert">{returnError}</p>
            )}
            <div className="order-modal-actions">
              <button
                className="order-action-button"
                type="button"
                onClick={() => setShowReturnModal(false)}
              >
                Keep Item
              </button>
              <button
                className="order-action-button order-action-button--primary"
                type="submit"
                disabled={submittingReturn}
              >
                {submittingReturn ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function OrderDetails() {
  const { id } = useParams();
  return <OrderDetailsContent key={id} id={id} />;
}

export default OrderDetails;
