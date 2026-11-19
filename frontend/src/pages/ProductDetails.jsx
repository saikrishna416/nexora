
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import {
  getSavedDeliveryLocation,
  lookupIndianPincode,
  saveDeliveryLocation,
} from "../utils/deliveryLocation";

const CART_SELECTION_STORAGE_KEY = "nexora_cart_selections";

function saveCartSelection(productId, selection) {
  const saved = JSON.parse(
    localStorage.getItem(CART_SELECTION_STORAGE_KEY) || "{}"
  );
  const hasSelection = Object.values(selection).some(Boolean);
  if (hasSelection) {
    saved[String(productId)] = selection;
  } else {
    delete saved[String(productId)];
  }
  localStorage.setItem(CART_SELECTION_STORAGE_KEY, JSON.stringify(saved));
}

function getProductText(product) {
  return [
    product?.category_name,
    product?.category?.name,
    product?.name,
    product?.title,
    product?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]/g, " ");
}

function getCategoryName(product) {
  return String(
    product?.category_name ||
      product?.category?.name ||
      product?.category ||
      ""
  );
}

function getStringOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === "string" || typeof option === "number") {
        const label = String(option).trim();
        return label ? { value: label, label } : null;
      }
      if (!option || typeof option !== "object") return null;

      const label =
        option.label ||
        option.name ||
        option.title ||
        (option.ram || option.storage
          ? `${option.ram || ""}${
              option.ram && !/\bram\b/i.test(String(option.ram)) ? " RAM" : ""
            }${
              option.storage ? ` | ${option.storage}` : ""
            }`
          : option.value);
      if (!label) return null;
      return {
        value: String(option.id ?? option.value ?? label),
        label: String(label),
        color: option.color || option.hex || "",
      };
    })
    .filter(Boolean);
}

const VARIANT_DEFINITIONS = {
  iphone: {
    selectorLabel: "Storage",
    baseKey: "256",
    options: [
      { key: "128", label: "128 GB", offset: 0, minPrice: 1000 },
      { key: "256", label: "256 GB", offset: 10000 },
      { key: "512", label: "512 GB", offset: 30000 },
    ],
  },
  mobile: {
    selectorLabel: "RAM & Storage",
    baseKey: "8/128",
    options: [
      { key: "8/128", label: "8 GB RAM | 128 GB", offset: 0 },
      { key: "8/256", label: "8 GB RAM | 256 GB", offset: 3000 },
      { key: "12/256", label: "12 GB RAM | 256 GB", offset: 6000 },
    ],
  },
  s26Mobile: {
    selectorLabel: "RAM & Storage",
    baseKey: "12/256",
    options: [
      { key: "12/256", label: "12 GB RAM | 256 GB", offset: 0 },
      { key: "12/512", label: "12 GB RAM | 512 GB", offset: 12000 },
    ],
  },
  laptop: {
    selectorLabel: "Configuration (RAM & SSD)",
    baseKey: "8/512",
    options: [
      { key: "8/512", label: "8 GB RAM | 512 GB SSD", offset: 0 },
      { key: "16/512", label: "16 GB RAM | 512 GB SSD", offset: 6000 },
      { key: "16/1024", label: "16 GB RAM | 1 TB SSD", offset: 14000 },
    ],
  },
  galaxyBookLaptop: {
    selectorLabel: "Configuration (RAM & SSD)",
    baseKey: "8/512",
    options: [
      { key: "8/512", label: "8 GB RAM | 512 GB SSD", offset: 0 },
      { key: "16/1024", label: "16 GB RAM | 1 TB SSD", offset: 14000 },
    ],
  },
  television: {
    selectorLabel: "Screen Size",
    baseKey: "43",
    options: [
      { key: "32", label: "32 inch", offset: -8000 },
      { key: "43", label: "43 inch", offset: 0 },
      { key: "55", label: "55 inch", offset: 15000 },
    ],
  },
  apparel: {
    selectorLabel: "Size",
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
    selectorLabel: "Size (UK/India)",
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

function getVariantType(product) {
  const category = getCategoryName(product).toLowerCase();
  const name = String(product?.name || product?.title || "").toLowerCase();
  const productText = `${category} ${name}`.replace(/[-_]/g, " ");

  if (
    /\b(washing machines?|front load|top load|semi automatic|fully automatic|washers?)\b/.test(productText)
  ) {
    return "washingMachine";
  }
  if (/\biphone\b/.test(name)) return "iphone";
  if (/\bgalaxy\s+book\b/.test(name)) return "galaxyBookLaptop";
  if (/\bs26\b/.test(name)) return "s26Mobile";
  if (/\b(laptop|macbook|book|ideapad|pavilion|inspiron|vivobook|thinkpad|victus|rog|tuf)\b/.test(name)) {
    return "laptop";
  }
  if (/\b(tv|television|bravia|qled|oled|uhd|smart tv)\b/.test(name)) {
    return "television";
  }
  if (/\b(refrigerator|fridge|frost free|single door|double door)\b/.test(name)) {
    return "refrigerator";
  }
  if (
    /\b(shoes?|sneakers?|footwear|sandals?|slippers?)\b/.test(
      `${category} ${name}`
    )
  ) {
    return "footwear";
  }
  if (
    /\b(clothing|fashion|apparel|women|men|kids|children)\b/.test(category) ||
    /\b(shirts?|t shirts?|tshirts?|kurtas?|dresses|jeans|hoodies|jackets)\b/.test(name)
  ) {
    return "apparel";
  }
  if (
    /\b(mobiles?|smartphones?|smart phone|tablets?)\b/.test(category) ||
    /\b(mobile phone|smartphone|smart phone|iphone|samsung|iqoo|oneplus|xiaomi|redmi|realme|oppo|vivo)\b/.test(name)
  ) {
    return "mobile";
  }
  return "";
}

function getVariantOptions(product, variantType) {
  const definition = VARIANT_DEFINITIONS[variantType];
  if (!definition) return [];

  const providedSizes = getStringOptions(product?.sizes);
  if (!["apparel", "footwear"].includes(variantType) || !providedSizes.length) {
    return definition.options.map((option) => ({ ...option }));
  }

  return providedSizes.map((option) => {
    const match = definition.options.find(
      (candidate) =>
        candidate.key.toLowerCase() === option.value.toLowerCase() ||
        candidate.label.toLowerCase() === option.label.toLowerCase()
    );
    const key = match?.key || option.value.replace(/^uk\s*/i, "");
    return {
      key,
      value: key,
      label:
        variantType === "footwear" && !/^uk\b/i.test(option.label)
          ? `UK ${option.label}`
          : option.label,
      offset: match?.offset || 0,
      minPrice: match?.minPrice,
    };
  });
}

function getBaseVariantKey(product, variantType, options) {
  const title = String(product?.name || product?.title || "");
  const definition = VARIANT_DEFINITIONS[variantType];
  if (!definition || !options.length) return "";
  if (
    ["apparel", "footwear", "s26Mobile", "galaxyBookLaptop"].includes(
      variantType
    )
  ) {
    return options.some((option) => option.key === definition.baseKey)
      ? definition.baseKey
      : options[0].key;
  }
  let titleKey = "";

  if (variantType === "iphone") {
    titleKey = title.match(/\b(128|256|512)\s*gb\b/i)?.[1] || "";
  } else if (variantType === "mobile") {
    const ram = title.match(/\b(8|12)\s*gb\s*ram\b/i)?.[1];
    const storage = title.match(/\b(128|256)\s*gb\b(?!\s*ram)/i)?.[1];
    if (ram && storage) titleKey = `${ram}/${storage}`;
  } else if (variantType === "laptop") {
    const ram = title.match(/\b(8|16)\s*gb\s*ram\b/i)?.[1];
    const storageMatch = title.match(/\b(512|1024|1)\s*(gb|tb)\s*ssd\b/i);
    if (ram && storageMatch) {
      const storage =
        storageMatch[2].toLowerCase() === "tb"
          ? 1024
          : Number(storageMatch[1]);
      titleKey = `${ram}/${storage}`;
    }
  } else if (variantType === "television") {
    titleKey = title.match(/\b(32|43|55)\s*(?:inch|inches|")/i)?.[1] || "";
  } else if (variantType === "apparel") {
    titleKey =
      title.match(/\bsize\s*(S|M|L|XL|XXL)\b/i)?.[1]?.toUpperCase() || "";
  } else if (variantType === "footwear") {
    titleKey =
      title.match(/\b(?:uk\s*|size\s*)(6|7|8|9|10)\b/i)?.[1] || "";
  }

  if (titleKey && options.some((option) => option.key === titleKey)) {
    return titleKey;
  }
  return options.some((option) => option.key === definition.baseKey)
    ? definition.baseKey
    : options[0]?.key || "";
}

function getDefaultVariantKey(product, variantType, options, baseKey) {
  const title = String(product?.name || product?.title || "");
  let titleKey = "";
  if (variantType === "s26Mobile") {
    const storage = title.match(/\b(256|512)\s*gb\b/i)?.[1];
    if (storage) titleKey = `12/${storage}`;
  } else if (variantType === "galaxyBookLaptop") {
    const ram = title.match(/\b(8|16)\s*gb\s*ram\b/i)?.[1];
    const storageMatch = title.match(/\b(512|1024|1)\s*(gb|tb)\s*ssd\b/i);
    if (ram && storageMatch) {
      const storage =
        storageMatch[2].toLowerCase() === "tb"
          ? 1024
          : Number(storageMatch[1]);
      titleKey = `${ram}/${storage}`;
    }
  } else if (variantType === "apparel") {
    titleKey =
      title.match(/\bsize\s*(S|M|L|XL|XXL)\b/i)?.[1]?.toUpperCase() || "";
  } else if (variantType === "footwear") {
    titleKey =
      title.match(/\b(?:uk\s*|size\s*)(6|7|8|9|10)\b/i)?.[1] || "";
  }
  return options.some((option) => option.key === titleKey)
    ? titleKey
    : baseKey;
}

function getBasePrice(product) {
  const price = Number(product?.price);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function getOriginalMrp(product, basePrice) {
  const candidate = Number(
    product?.mrp ??
      product?.original_price ??
      product?.list_price ??
      product?.product_mrp
  );
  return Number.isFinite(candidate) && candidate >= basePrice
    ? candidate
    : basePrice;
}

function getVariantPrice(product, options, selectedOption, baseVariantKey) {
  const basePrice = getBasePrice(product);
  if (!selectedOption) return basePrice;
  const baseOption =
    options.find((option) => option.key === baseVariantKey) || selectedOption;
  const adjustment = selectedOption.offset - baseOption.offset;
  return Math.max(selectedOption.minPrice || 0, basePrice + adjustment);
}

function getVariantMrp(product, selectedPrice) {
  const basePrice = getBasePrice(product);
  const baseMrp = getOriginalMrp(product, basePrice);
  if (baseMrp <= basePrice || basePrice <= 0) return selectedPrice;
  return Math.max(
    selectedPrice,
    Math.round(selectedPrice * (baseMrp / basePrice) * 100) / 100
  );
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function parseDescriptionSpecifications(description) {
  return String(description || "")
    .replace(/[•▪·]/g, "\n")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*([^:–—-]{2,40})\s*[:–—-]\s*(.+)\s*$/))
    .filter(Boolean)
    .map((match) => [match[1].trim(), match[2].trim()]);
}

function getSpecificationRows(product) {
  if (!product) return [];
  const storedSpecifications = Array.isArray(product.specifications)
    ? product.specifications
        .map((item) =>
          Array.isArray(item)
            ? item
            : item && typeof item === "object"
              ? [item.name || item.key || item.label, item.value]
              : null
        )
        .filter((entry) => entry?.[0] && entry?.[1] != null)
    : product.specifications && typeof product.specifications === "object"
      ? Object.entries(product.specifications)
      : [];
  const descriptionSpecifications = parseDescriptionSpecifications(
    product.description
  );
  const parsed = Object.fromEntries([
    ...descriptionSpecifications,
    ...storedSpecifications,
  ]);
  const parsedBrand = Object.entries(parsed).find(
    ([key]) => key.toLowerCase() === "brand"
  )?.[1];
  const stock = Number(product.stock || 0);
  const rows = [
    ["Brand", product.brand || parsedBrand || "Not specified in product record"],
    ["Category", getCategoryName(product) || "Not specified"],
    ["Model / Product Name", product.model || product.name || "Not specified"],
    ["Availability", stock > 0 ? "In stock" : "Out of stock"],
    ["Stock", `${stock} available`],
    ["Seller", "Nexora Retail"],
    ["Price", `₹${Number(product.price || 0).toLocaleString("en-IN")}`],
    ["Catalog Status", product.is_active === false ? "Inactive" : "Active"],
    ...["created_at", "updated_at"]
      .filter((key) => product[key])
      .map((key) => [
        key === "created_at" ? "Listed On" : "Last Updated",
        new Date(product[key]).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      ]),
  ];
  const capacityInTitle =
    /\b(refrigerator|fridge|frost free|single door|double door)\b/i.test(
      product.name || ""
    ) &&
    String(product.name || "").match(
      /\b(\d{2,4})\s*(l|litre|litres|liter|liters)\b/i
    );
  const hasCapacitySpecification = Object.keys(parsed).some((key) =>
    /capacity/i.test(key)
  );
  if (capacityInTitle && !hasCapacitySpecification) {
    rows.splice(3, 0, [
      "Capacity",
      `${capacityInTitle[1]} ${capacityInTitle[2]}`,
    ]);
  }
  const reservedFields = new Set([
    "id",
    "category",
    "category_name",
    "name",
    "model",
    "brand",
    "price",
    "description",
    "image",
    "images",
    "stock",
    "specifications",
    "highlights",
    "sizes",
    "variants",
    "colors",
    "is_active",
    "created_at",
    "updated_at",
  ]);
  const formatValue = (value) => {
    if (Array.isArray(value)) return value.map(String).join(", ");
    if (value && typeof value === "object") {
      return Object.entries(value)
        .map(([key, item]) => `${key}: ${String(item)}`)
        .join(", ");
    }
    return String(value);
  };
  const dynamicRows = [
    ...Object.entries(product).filter(
      ([key, value]) =>
        !reservedFields.has(key) &&
        value !== null &&
        value !== "" &&
        typeof value !== "object"
    ),
    ...Object.entries(parsed).filter(
      ([key, value]) =>
        !["brand"].includes(key.toLowerCase()) &&
        value !== null &&
        value !== ""
    ),
  ];
  const seen = new Set(rows.map(([key]) => key.toLowerCase()));
  dynamicRows.forEach(([key, value]) => {
    const label = key
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    if (!seen.has(label.toLowerCase())) {
      rows.push([label, formatValue(value)]);
      seen.add(label.toLowerCase());
    }
  });
  return rows;
}

function getProductHighlights(product) {
  const stored = Array.isArray(product?.highlights)
    ? product.highlights
        .map((highlight) =>
          typeof highlight === "string"
            ? highlight
            : highlight?.text || highlight?.label || highlight?.value || ""
        )
        .filter(Boolean)
    : typeof product?.highlights === "string"
      ? product.highlights.split(/\r?\n|[•▪·]/)
      : [];
  const description = String(product?.description || "")
    .replace(/[•▪·]/g, "\n")
    .split(/[\r\n]+|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[\s*-]+|[\s*-]+$/g, "").trim())
    .filter((line) => line.length > 3);
  return [...new Set([...(stored.length ? stored : description)])].slice(0, 8);
}

function getImageUrl(image) {

  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {

    return image;

  }

  return `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`}${

    image.startsWith("/") ? "" : "/"

  }${image}`;

}

function isFootwear(product) {
  const text = getProductText(product);

  return /\b(shoes?|sneakers?|footwear|sandals?|boots?|slippers?|loafers?|heels?|flip flops|trainers?)\b/.test(text);

}

function getProductColors(product) {
  const explicitColors = getStringOptions(product?.colors);
  const variantColors = (Array.isArray(product?.variants) ? product.variants : [])
    .filter((variant) => variant && typeof variant === "object" && variant.color)
    .map((variant) => ({
      value: String(variant.color),
      label: String(variant.color),
      color: variant.color_hex || "",
    }));
  const colors = explicitColors.length ? explicitColors : variantColors;
  return colors.filter(
    (color, index, list) =>
      list.findIndex(
        (other) => other.label.toLowerCase() === color.label.toLowerCase()
      ) === index
  );
}

function ProductDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const isLoggedIn = Boolean(localStorage.getItem("access_token"));

  useLayoutEffect(() => {

  window.scrollTo(0, 0);

}, [id]);

  const [isWishlisted, setIsWishlisted] = useState(false);

  const [product, setProduct] = useState(null);

  const [recommendations, setRecommendations] = useState(

    []

  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [message, setMessage] = useState("");

  const [wishlistMessage, setWishlistMessage] = useState("");

  const [reviews, setReviews] = useState([]);

  const [variantSelection, setVariantSelection] = useState(null);

  const [deliveryLocation, setDeliveryLocationState] = useState(
    getSavedDeliveryLocation
  );

  const [pincode, setPincode] = useState(
    () => getSavedDeliveryLocation().pincode || ""
  );

  const [deliveryMessage, setDeliveryMessage] = useState("");

  const expectedDeliveryDate = (() => {

  const date = new Date();

  date.setDate(date.getDate() + 4);

  return date.toLocaleDateString("en-IN", {

    weekday: "short",

    day: "numeric",

    month: "long",

    year: "numeric",

  });

})();

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => localStorage.getItem("nexora_selected_address") || ""
  );
  const [addressMessage, setAddressMessage] = useState("");

  useEffect(() => {
    const syncDeliveryLocation = () => {
      const location = getSavedDeliveryLocation();
      setDeliveryLocationState(location);
      setPincode(location.pincode || "");
    };
    window.addEventListener("nexora:location-updated", syncDeliveryLocation);
    window.addEventListener("storage", syncDeliveryLocation);
    return () => {
      window.removeEventListener(
        "nexora:location-updated",
        syncDeliveryLocation
      );
      window.removeEventListener("storage", syncDeliveryLocation);
    };
  }, []);

  // Load account-owned addresses from Django. Migrate old browser-only addresses
  // once when the account has no saved addresses yet.
  useEffect(() => {
    let active = true;

    const loadAddresses = async () => {
      if (!localStorage.getItem("access_token")) {
        if (active) {
          setAddresses([]);
          setAddressesLoading(false);
        }
        return;
      }

      setAddressesLoading(true);
      try {
        const response = await api.get("/accounts/addresses/");
        let saved = Array.isArray(response.data) ? response.data : response.data.results || [];

        if (saved.length === 0) {
          let legacy = [];
          try {
            legacy = JSON.parse(localStorage.getItem("nexora_addresses") || "[]");
          } catch {
            legacy = [];
          }

          for (const address of legacy) {
            try {
              const migrated = await api.post("/accounts/addresses/", {
                full_name: address.name || address.full_name || "",
                phone_number: address.phone || address.phone_number || "",
                address_line: address.line || address.address_line || "",
                city: address.city || "",
                state: address.state || "",
                pincode: address.pincode || "",
              });
              saved = [...saved, migrated.data];
            } catch (migrationError) {
              console.warn("Could not migrate a browser-saved address.", migrationError);
            }
          }
          if (saved.length) localStorage.removeItem("nexora_addresses");
        }

        const normalized = saved.map((address) => ({
          ...address,
          id: String(address.id),
          name: address.full_name ?? address.name ?? "",
          phone: address.phone_number ?? address.phone ?? "",
          line: address.address_line ?? address.line ?? "",
        }));

        if (active) {
          setAddresses(normalized);
          const rememberedId = localStorage.getItem("nexora_selected_address");
          const selected = normalized.find((address) => String(address.id) === String(rememberedId)) || normalized.find((address) => address.is_default) || normalized[0];
          if (selected) {
            setSelectedAddressId(String(selected.id));
            localStorage.setItem("nexora_selected_address", String(selected.id));
            const formatted = `${selected.name}, ${selected.phone}\n${selected.line}, ${selected.city}, ${selected.state} - ${selected.pincode}`;
            localStorage.setItem("shipping_address", formatted);
          }
        }
      } catch (err) {
        console.error("Saved address loading error:", err.response?.data || err);
        if (active) setAddressMessage("Could not load saved addresses from your account. Please try again.");
      } finally {
        if (active) setAddressesLoading(false);
      }
    };

    loadAddresses();
    return () => { active = false; };
  }, []);

  const showShoeSizes = isFootwear(product);
  const variantType = getVariantType(product);
  const showClothingSizes = variantType === "apparel";
  const showSizeSelector = ["apparel", "footwear"].includes(variantType);
  const variantOptions = useMemo(
    () => getVariantOptions(product, variantType),
    [product, variantType]
  );
  const baseVariantKey = getBaseVariantKey(
    product,
    variantType,
    variantOptions
  );
  const defaultVariantKey = getDefaultVariantKey(
    product,
    variantType,
    variantOptions,
    baseVariantKey
  );
  const availableSizes = useMemo(() => {
    if (!showSizeSelector) return [];
    return variantOptions.map((option) => ({
      value: option.key,
      label: option.label,
    }));
  }, [showSizeSelector, variantOptions]);
  const productColors = useMemo(
    () => getProductColors(product),
    [product]
  );
  const selectionDefaults = {
    variant: defaultVariantKey,
    color: productColors[0]?.value || "",
    size: showSizeSelector ? defaultVariantKey : "",
    sizeChart: false,
  };
  const activeSelection =
    variantSelection &&
    String(variantSelection.productId) === String(product?.id)
      ? variantSelection
      : selectionDefaults;
  const selectedVariant = activeSelection.variant;
  const selectedColor = activeSelection.color;
  const selectedSize = activeSelection.size;
  const showSizeChart = activeSelection.sizeChart;
  const setSelectionField = (field, value) => {
    setVariantSelection((current) => {
      const currentSelection =
        current && String(current.productId) === String(product?.id)
          ? current
          : selectionDefaults;
      return {
        productId: product?.id,
        ...currentSelection,
        [field]:
          typeof value === "function"
            ? value(currentSelection[field])
            : value,
      };
    });
  };
  const setSelectedVariant = (value) => setSelectionField("variant", value);
  const setSelectedColor = (value) => setSelectionField("color", value);
  const setSelectedSize = (value) => setSelectionField("size", value);
  const setShowSizeChart = (value) => setSelectionField("sizeChart", value);


  const [showAddressForm, setShowAddressForm] =

    useState(false);


  const [addressForm, setAddressForm] = useState({

    name: "",

    phone: "",

    line: "",

    city: "",

    state: "",

    pincode: "",

  });

  // Load product, related products, and reviews.

  useEffect(() => {

    let active = true;

    api

      .get(`/products/${id}/`)

      .then((response) => {

        if (active) {

          setProduct(response.data);

        }

      })

      .catch((err) => {

        console.error(

          "Product loading error:",

          err.response?.data || err

        );

        if (active) {

          setError("Failed to load product.");

        }

      })

      .finally(() => {

        if (active) {

          setLoading(false);

        }

      });

    api

      .get("/products/?page_size=100")

      .then((response) => {

        const data =

          response.data.results || response.data;

        if (active && Array.isArray(data)) {

          setRecommendations(

            data.filter(

              (item) => String(item.id) !== String(id)

            )

          );

        }

      })

      .catch((err) => {

        console.error(

          "Related products error:",

          err

        );

      });

    api

      .get(`/reviews/products/${id}/`)

      .then((response) => {

        if (active) {

          setReviews(

            response.data.results || response.data

          );

        }

      })

      .catch((err) => {

        console.error("Reviews loading error:", err);

      });

    return () => {

      active = false;

    };

  }, [id]);

  // Product image gallery.

  const productImages = [

    ...(product?.image

      ? [{ id: "main", image: product.image }]

      : []),

    ...(Array.isArray(product?.images)

      ? product.images

      : []),

  ].filter(

    (item, index, array) =>

      item?.image &&

      array.findIndex(

        (image) => image.image === item.image

      ) === index

  );

  const activeImage =

    productImages[activeImageIndex]?.image || null;

  const specificationRows = useMemo(
    () => getSpecificationRows(product),
    [product]
  );
  const productHighlights = useMemo(
    () => getProductHighlights(product),
    [product]
  );
  const selectedVariantOption = variantOptions.find(
    (option) => option.key === selectedVariant
  );
  const selectedPrice = getVariantPrice(
    product,
    variantOptions,
    selectedVariantOption,
    baseVariantKey
  );
  const selectedMrp = getVariantMrp(product, selectedPrice);
  const selectedAttributeLabel = selectedVariantOption?.label || "";
  const selectorLabel =
    VARIANT_DEFINITIONS[variantType]?.selectorLabel || "Variant";
  const selectedSpecificationRows = selectedAttributeLabel
    ? [
        ...specificationRows.filter(
          ([key]) =>
            ![
              "price",
              "selling price",
              "selected variant",
              "selected size",
              selectorLabel.toLowerCase(),
            ].includes(String(key).toLowerCase())
        ),
        [selectorLabel, selectedAttributeLabel],
        ["Selling Price", formatINR(selectedPrice)],
      ]
    : [
        ...specificationRows.filter(
          ([key]) => String(key).toLowerCase() !== "price"
        ),
        ["Selling Price", formatINR(selectedPrice)],
      ];
  const selectedColorOption = productColors.find(
    (color) => color.value === selectedColor
  );

  // Add item to cart. Guests use localStorage; signed-in users use the API.
  const handleAddToCart = async () => {
    setMessage("");
    setError("");

    if (availableSizes.length > 0 && !selectedSize) {
      setMessage("Please select a size first.");
      return;
    }
    if (variantOptions.length > 0 && !selectedVariant) {
      setMessage("Please select a variant first.");
      return;
    }
    if (productColors.length > 1 && !selectedColor) {
      setMessage("Please select a color first.");
      return;
    }

    if (!product || product.stock <= 0) {
      setError("This product is out of stock.");
      return;
    }

    const rawToken = localStorage.getItem("access_token");
    // Treat missing/stale sentinel values as logged out.
    const accessToken =
      rawToken && !["null", "undefined", ""].includes(rawToken.trim())
        ? rawToken.trim()
        : null;

    const selection = {
      ...(showSizeSelector && selectedVariantOption
        ? { selected_size: selectedVariantOption.label }
        : {}),
      ...(selectedVariantOption && !showSizeSelector
        ? { selected_variant: selectedVariantOption.label }
        : {}),
      ...(selectedColorOption
        ? { selected_color: selectedColorOption.label }
        : {}),
      selected_price: selectedPrice,
      selected_mrp: selectedMrp,
    };

    const addToGuestCart = () => {
      const storageKey = "nexora_guest_cart";
      const guestCart = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const existing = guestCart.find(
        (item) =>
          String(item.product) === String(product.id) &&
          String(item.selected_size || "") === String(selection.selected_size || "") &&
          String(item.selected_variant || "") === String(selection.selected_variant || "") &&
          String(item.selected_color || "") === String(selection.selected_color || "")
      );

      if (existing) {
        existing.quantity = Math.min(
          Number(existing.quantity || 1) + 1,
          Number(product.stock)
        );
      } else {
        guestCart.push({
          id: `guest-${product.id}-${selection.selected_size || selection.selected_variant || "default"}-${selection.selected_color || ""}`,
          product: product.id,
          product_name: product.name,
          product_price: selectedPrice,
          selected_price: selectedPrice,
          mrp: selectedMrp,
          selected_mrp: selectedMrp,
          product_image: product.image || "",
          quantity: 1,
          ...selection,
          stock: Number(product.stock),
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(guestCart));
      setMessage("Product added to cart!");
      setError("");
    };

    if (!accessToken) {
      localStorage.removeItem("access_token");
      addToGuestCart();
      return;
    }

    try {
      await api.post("/cart/add/", {
        product: product.id,
        quantity: 1,
        ...selection,
      });
      setMessage("Product added to cart!");
      try {
        saveCartSelection(product.id, selection);
      } catch (selectionError) {
        console.error("Could not save product selection:", selectionError);
        setMessage(
          "Product added to cart, but its size or variant could not be saved for checkout."
        );
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const authError =
        err.response?.status === 401 ||
        (typeof detail === "string" &&
          detail.toLowerCase().includes("authentication credentials were not provided"));

      if (authError) {
        // If the backend rejects a stale token, continue as a guest instead
        // of showing the DRF authentication error to a logged-out shopper.
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        try {
          addToGuestCart();
        } catch (guestError) {
          console.error("Guest cart save error:", guestError);
          setError("Could not save this item to your cart.");
        }
        return;
      }

      console.error("Add to cart error:", err.response?.data || err);
      setError(
        detail ||
          err.response?.data?.message ||
          "Failed to add product to cart."
      );
    }
  };

//Add to wishlist

const handleAddToWishlist = async () => {

  console.log("Wishlist handler called. Product ID:", product?.id);

  if (!product?.id) {

    setWishlistMessage("Product is still loading. Please try again.");

    return;

  }

  // Keep the rest of your existing function unchanged.

  setWishlistMessage("");

  try {

    const response = await api.post("/wishlist/add/", {

      product: product.id,

    });

    setIsWishlisted(true);

    setWishlistMessage(

      response.data?.detail || "Product added to wishlist!"

    );

  } catch (err) {

    console.error(

      "Wishlist request failed:",

      err.response?.status,

      err.response?.data || err.message

    );

    if (err.response?.status === 401) {

      setWishlistMessage("Please log in again to use your wishlist.");

    } else {

      setWishlistMessage(

        err.response?.data?.detail ||

        err.response?.data?.message ||

        "Could not add to wishlist. Please try again."

      );

    }

  }

};

const selectedAddress = addresses.find(

  (address) =>

    String(address.id) === String(selectedAddressId)

);

const formattedSelectedAddress = selectedAddress

  ? `${selectedAddress.name}, ${selectedAddress.phone}\n${selectedAddress.line}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`

  : "";

//Handle Buy Now

const handleBuyNow = () => {

  if (product.stock <= 0) {

    setError("This product is out of stock.");

    return;

  }

  if (availableSizes.length > 0 && !selectedSize) {

    setMessage("Please select a size first.");

    return;

  }
  if (variantOptions.length > 0 && !selectedVariant) {
    setMessage("Please select a variant first.");
    return;
  }
  if (productColors.length > 1 && !selectedColor) {
    setMessage("Please select a color first.");
    return;
  }

  navigate("/checkout", {

    state: {

      buyNowProduct: {

        ...product,

        quantity: 1,

        selected_price: selectedPrice,
        selected_mrp: selectedMrp,

        ...(showSizeSelector && selectedVariantOption
          ? { selected_size: selectedVariantOption.label }
          : {}),

        ...(selectedVariantOption && !showSizeSelector
          ? { selected_variant: selectedVariantOption.label }
          : {}),

        ...(selectedColorOption
          ? { selected_color: selectedColorOption.label }
          : {}),

      },

      selectedAddress: formattedSelectedAddress,

    },

  });

};

  // Save address in this browser.

  const handleAddressChange = (event) => {

    const { name, value } = event.target;

    setAddressForm((current) => ({

      ...current,

      [name]:

        name === "pincode"

          ? value.replace(/\D/g, "").slice(0, 6)

          : value,

    }));

  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setAddressMessage("");

    if (!localStorage.getItem("access_token")) {
      setAddressMessage("Please log in to save an address to your account.");
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setAddressMessage("Enter a valid 6-digit Indian pincode.");
      return;
    }
    if (!/^\+?[0-9\s-]{10,15}$/.test(addressForm.phone.trim())) {
      setAddressMessage("Enter a valid phone number.");
      return;
    }

    try {
      const response = await api.post("/accounts/addresses/", {
        full_name: addressForm.name.trim(),
        phone_number: addressForm.phone.trim(),
        address_line: addressForm.line.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode,
      });
      const newAddress = {
        ...response.data,
        id: String(response.data.id),
        name: response.data.full_name,
        phone: response.data.phone_number,
        line: response.data.address_line,
      };
      setAddresses((current) => [...current, newAddress]);
      setSelectedAddressId(newAddress.id);
      localStorage.setItem("nexora_selected_address", newAddress.id);
      const formattedAddress = `${newAddress.name}, ${newAddress.phone}\n${newAddress.line}, ${newAddress.city}, ${newAddress.state} - ${newAddress.pincode}`;
      localStorage.setItem("shipping_address", formattedAddress);
      setPincode(newAddress.pincode);
      setAddressForm({ name: "", phone: "", line: "", city: "", state: "", pincode: "" });
      setShowAddressForm(false);
      setAddressMessage("Address saved to your account.");
    } catch (err) {
      console.error("Save address error:", err.response?.data || err);
      const data = err.response?.data;
      setAddressMessage(data?.detail || data?.pincode?.[0] || data?.phone_number?.[0] || "Could not save address. Please try again.");
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(String(address.id));
    localStorage.setItem("nexora_selected_address", String(address.id));
    const formattedAddress =
      `${address.name || address.full_name}, ${address.phone || address.phone_number}\n` +
      `${address.line || address.address_line}, ${address.city}, ${address.state} - ${address.pincode}`;
    localStorage.setItem("shipping_address", formattedAddress);
    try {
      saveDeliveryLocation({
        area: address.area || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode,
      });
    } catch (error) {
      console.error("Could not sync selected address:", error);
      setDeliveryMessage("Address selected, but delivery location could not be synced.");
    }
  };

  // Look up Indian postal details for a valid six-digit pincode.

  const handleCheckDelivery = async (event) => {

    event.preventDefault();

    setDeliveryMessage("");

    if (!/^[1-9]\d{5}$/.test(pincode)) {

      setDeliveryMessage("Enter a valid 6-digit Indian pincode.");

      return;

    }

    try {

      const location = await lookupIndianPincode(pincode);
      saveDeliveryLocation(location);
      const locality = [location.area, location.city]
        .filter(Boolean)
        .join(", ");
      setDeliveryMessage(
        location.source === "india-post"
          ? `Deliver to ${locality || "PIN"} - ${location.pincode}. Location synced with the site.`
          : `PIN ${location.pincode} saved. Locality lookup is unavailable, but the PIN is synced with the site.`
      );

    } catch (err) {

      console.error("Pincode lookup error:", err);

      setDeliveryMessage(err.message || "Could not save this pincode.");

    }

  };

  // Detect current location and sync it with the Navbar.

  const handleDetectLocation = () => {

    setDeliveryMessage("");

    if (!navigator.geolocation) {

      setDeliveryMessage("Location detection is not supported by this browser.");

      return;

    }

    setDeliveryMessage("Requesting location permission…");

    navigator.geolocation.getCurrentPosition(

      async ({ coords }) => {

        try {

          const response = await fetch(

            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`

          );

          const data = await response.json();

          const postcode = String(data?.address?.postcode || "")
            .replace(/\D/g, "")
            .match(/[1-9]\d{5}/)?.[0];

          if (postcode) {

            setPincode(postcode);

            const area =

              data.address.suburb ||
              data.address.neighbourhood ||
              data.address.city ||
              data.address.town ||
              data.address.village ||
              "";
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              "";
            const postalLocation = await lookupIndianPincode(postcode);
            const location = saveDeliveryLocation({
              ...postalLocation,
              area: area || postalLocation.area,
              city: city || postalLocation.city,
              state: data.address.state || postalLocation.state,
            });
            setDeliveryMessage(
              `Deliver to ${[location.area, location.city].filter(Boolean).join(", ") || "your location"} - ${postcode}.`
            );

          } else {

            setDeliveryMessage(

              "Location detected, but a six-digit pincode was not found. Please enter it manually."

            );

          }

        } catch (err) {

          console.error("Location lookup error:", err);

          setDeliveryMessage("Could not save your location. Please enter your pincode manually.");

        }

      },

      (err) => {

        console.error("Browser geolocation error:", err);

        setDeliveryMessage("Location permission was denied or unavailable. Please enter your pincode manually.");

      },

      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }

    );

  };

  if (loading) {

    return (

      <main className="pd-page">

        <p className="pd-status">

          Loading product...

        </p>

        <style>{styles}</style>

      </main>

    );

  }

  if (error && !product) {

    return (

      <main className="pd-page">

        <p className="pd-status pd-error">

          {error}

        </p>

        <style>{styles}</style>

      </main>

    );

  }

  if (!product) {

    return (

      <main className="pd-page">

        <p className="pd-status">

          Product not found.

        </p>

        <style>{styles}</style>

      </main>

    );

  }

  // Prefer products from the same category.

  const sameCategoryProducts = recommendations.filter(

    (item) =>

      String(item.category_name || "").toLowerCase() ===

      String(product.category_name || "").toLowerCase()

  );

  const suggestedProducts = [

    ...sameCategoryProducts,

    ...recommendations.filter(

      (item) =>

        !sameCategoryProducts.some(

          (same) => same.id === item.id

        )

    ),

  ].slice(0, 8);

  return (

    <main className="pd-page">

      <style>{styles}</style>

      <div className="pd-container">

        <nav className="pd-breadcrumb">

          <button

            type="button"

            onClick={() => navigate("/products")}

          >

            Products

          </button>

          <span>›</span>

          <span>

            {product.category_name || "Product"}

          </span>

        </nav>

        {/* Main product information */}

        <section className="pd-main-grid">

          {/* Product images */}

          <div className="pd-gallery">

            <div className="pd-image-frame">

                <button

                  type="button"

                  className={`pd-wish ${isWishlisted ? "active" : ""}`}

                  onClick={() => {

                    console.log("Wishlist heart clicked");

                    handleAddToWishlist();

                  }}

                  aria-label="Add to wishlist"

                >

                  {isWishlisted ? "♥" : "♡"}

                </button>

              {activeImage ? (

                <img

                  className="pd-main-image"

                  src={getImageUrl(activeImage)}

                  alt={product.name}

                />

              ) : (

                <div className="pd-no-image">

                  No image available

                </div>

              )}

              {productImages.length > 1 && (

                <>

                  <button

                    className="pd-arrow pd-prev"

                    type="button"

                    aria-label="Previous image"

                    onClick={() =>

                      setActiveImageIndex(

                        (current) =>

                          (current -

                            1 +

                            productImages.length) %

                          productImages.length

                      )

                    }

                  >

                    ‹

                  </button>

                  <button

                    className="pd-arrow pd-next"

                    type="button"

                    aria-label="Next image"

                    onClick={() =>

                      setActiveImageIndex(

                        (current) =>

                          (current + 1) %

                          productImages.length

                      )

                    }

                  >

                    ›

                  </button>

                </>

              )}

            </div>

            {productImages.length > 1 && (

              <div className="pd-thumbnails">

                {productImages.map((item, index) => (

                  <button

                    key={item.id || item.image}

                    type="button"

                    className={

                      index === activeImageIndex

                        ? "active"

                        : ""

                    }

                    onClick={() =>

                      setActiveImageIndex(index)

                    }

                  >

                    <img

                      src={getImageUrl(item.image)}

                      alt={`${product.name} view ${

                        index + 1

                      }`}

                    />

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* Product information and buying options */}

          <div className="pd-summary">

            <p className="pd-category">

              {product.category_name || "Nexora product"}

            </p>

            <h1>
              {showSizeSelector && selectedAttributeLabel
                ? `${product.name} — Size: ${selectedAttributeLabel}`
                : selectedAttributeLabel
                  ? `${product.name} (${selectedAttributeLabel})`
                  : product.name}
            </h1>

            <div className="pd-price">
              <span className="pd-price-label">Selling Price</span>
              {formatINR(selectedPrice)}
            </div>
            {selectedMrp > selectedPrice && (
              <div className="pd-price-discount">
                <del>{formatINR(selectedMrp)}</del>
                <span>
                  {Math.round(((selectedMrp - selectedPrice) / selectedMrp) * 100)}% off
                </span>
              </div>
            )}

            <p className="pd-description">

              {product.description ||

                "No description is available for this product yet."}

            </p>

            <p

              className={

                product.stock > 0

                  ? "pd-stock in-stock"

                  : "pd-stock out-stock"

              }

            >

              {product.stock > 0

                ? `${product.stock} items available`

                : "Out of stock"}

            </p>

            {/* Category-aware size and variant selectors */}

            {availableSizes.length > 0 && (

              <section
                className={`pd-size-box${showSizeSelector ? " pd-variant-box" : ""}`}
              >

                <div className="pd-selector-heading">
                  <h3>{showShoeSizes ? "Select footwear size" : "Select Size"}</h3>
                  {showClothingSizes && (
                    <button
                      type="button"
                      className="pd-size-chart-toggle"
                      aria-expanded={showSizeChart}
                      onClick={() => setShowSizeChart((shown) => !shown)}
                    >
                      {showSizeChart ? "Hide Size Chart" : "Size Chart"}
                    </button>
                  )}
                </div>

                <div className="pd-size-options">

                  {availableSizes.map((size) => (

                    <button

                      key={size.value}

                      type="button"

                      className={

                        selectedSize === size.value ? "selected" : ""

                      }

                      aria-pressed={selectedSize === size.value}

                      onClick={() => {
                        setSelectedSize(size.value);
                        setSelectedVariant(size.value);
                      }}

                    >

                      <span>{size.label}</span>
                      <small>
                        {formatINR(
                          getVariantPrice(
                            product,
                            variantOptions,
                            variantOptions.find((option) => option.key === size.value),
                            baseVariantKey
                          )
                        )}
                      </small>

                    </button>

                  ))}

                </div>

                <small>

                  {showShoeSizes
                    ? "Sizes are shown in UK / India sizing."
                    : "Choose the size you want before ordering."}

                </small>

                {showSizeChart && (
                  <div className="pd-size-chart-preview">
                    <strong>Available size options</strong>
                    <p>{availableSizes.map((size) => size.label).join(" · ")}</p>
                    <small>
                      Product-specific body measurements are not included in this listing.
                    </small>
                  </div>
                )}

              </section>

            )}

            {variantOptions.length > 0 && !showSizeSelector && (
              <section className="pd-size-box pd-variant-box">
                <h3>{selectorLabel}</h3>
                <div className="pd-size-options">
                  {variantOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={selectedVariant === option.key ? "selected" : ""}
                      aria-pressed={selectedVariant === option.key}
                      onClick={() => setSelectedVariant(option.key)}
                    >
                      <span>{option.label}</span>
                      <small>
                        {formatINR(
                          getVariantPrice(product, variantOptions, option, baseVariantKey)
                        )}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {productColors.length > 1 && (
              <section className="pd-size-box pd-color-box">
                <h3>Color: {selectedColorOption?.label || "Choose a color"}</h3>
                <div className="pd-size-options">
                  {productColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={selectedColor === color.value ? "selected" : ""}
                      aria-pressed={selectedColor === color.value}
                      onClick={() => setSelectedColor(color.value)}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Delivery and address selector */}

            <section className="pd-delivery">

              <h3>Delivery</h3>

              <p className="pd-active-location">
                Deliver to{" "}
                <strong>
                  {[deliveryLocation.area, deliveryLocation.city]
                    .filter(
                      (value, index, list) =>
                        value &&
                        list.findIndex(
                          (other) =>
                            String(other).toLowerCase() ===
                            String(value).toLowerCase()
                        ) === index
                    )
                    .join(", ") || "your location"}
                  {deliveryLocation.pincode
                    ? ` - ${deliveryLocation.pincode}`
                    : ""}
                </strong>
              </p>

              <form

                className="pd-pincode-form"

                onSubmit={handleCheckDelivery}

              >

                <input
                  type="text"
                  value={pincode}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[1-9][0-9]{5}"
                  placeholder="Enter 6-digit pincode"
                  aria-label="Delivery pincode"

                  onChange={(event) =>

                    setPincode(

                      event.target.value

                        .replace(/\D/g, "")

                        .slice(0, 6)

                    )

                  }

                />

                <button type="submit">

                  Check

                </button>

                <button type="button" onClick={handleDetectLocation}>
                  Use current location
                </button>
              </form>

              <ul className="pd-delivery-promises">
                <li>Free Delivery by {expectedDeliveryDate}</li>
                <li>Cash on Delivery Available</li>
                <li>7 Days Replacement Policy</li>
              </ul>

              {deliveryMessage && (

                <p className="pd-feedback">

                  {deliveryMessage}

                </p>

              )}

              {isLoggedIn && (

                <>

<div className="pd-address-title">

                <strong>Saved addresses</strong>
                {addressesLoading && <small aria-live="polite"> Loading…</small>}

                <button

                  type="button"

                  onClick={() =>

                    setShowAddressForm(

                      (current) => !current

                    )

                  }

                >

                  {showAddressForm

                    ? "Cancel"

                    : "+ Add address"}

                </button>

              </div>

              {addresses.length > 0 && (

                <div className="pd-address-list">

                  {addresses.map((address) => (

                    <label

                      key={address.id}

                      className={`pd-address-option ${

                        selectedAddressId === address.id

                          ? "chosen"

                          : ""

                      }`}

                    >

                      <input

                        type="radio"

                        name="savedAddress"

                        checked={

                          selectedAddressId === address.id

                        }

                        onChange={() =>

                          handleSelectAddress(address)

                        }

                      />

                      <span>

                        <strong>{address.name}</strong>

                        {" · "}

                        {address.phone}

                        <br />

                        {address.line}, {address.city},{" "}

                        {address.state} – {address.pincode}

                      </span>

                    </label>

                  ))}

                </div>

              )}

              {showAddressForm && (

                <form

                  className="pd-address-form"

                  onSubmit={handleSaveAddress}

                >

                  <input

                    name="name"

                    placeholder="Full name"

                    value={addressForm.name}

                    onChange={handleAddressChange}

                    required

                  />

                  <input

                    name="phone"

                    placeholder="Phone number"

                    value={addressForm.phone}

                    onChange={handleAddressChange}

                    inputMode="tel"

                    required

                  />

                  <input

                    name="line"

                    placeholder="House number, street, area"

                    value={addressForm.line}

                    onChange={handleAddressChange}

                    required

                  />

                  <input

                    name="city"

                    placeholder="City"

                    value={addressForm.city}

                    onChange={handleAddressChange}

                    required

                  />

                  <input

                    name="state"

                    placeholder="State"

                    value={addressForm.state}

                    onChange={handleAddressChange}

                    required

                  />

                  <input

                    name="pincode"

                    placeholder="6-digit pincode"

                    value={addressForm.pincode}

                    maxLength={6}

                    inputMode="numeric"

                    onChange={handleAddressChange}

                    required

                  />

                  <button

                    className="pd-primary"

                    type="submit"

                  >

                    Save Address

                  </button>

                </form>

              )}

              {addressMessage && (

                <p className="pd-feedback">

                  {addressMessage}

                </p>

              )}

              <small className="pd-note">

                Addresses are saved securely to your account and sync when you sign in on another device.

              </small>

                </>

              )}

            </section>

            {/* Expected Delivery Date */}

<div

  style={{

    display: "flex",

    alignItems: "center",

    gap: "12px",

    padding: "15px",

    margin: "20px 0",

    backgroundColor: "#f0fdfa",

    border: "1px solid #99f6e4",

    borderRadius: "10px",

  }}

>

  <span style={{ fontSize: "28px" }}>🚚</span>

  <div>

    <p

      style={{

        margin: "0 0 5px",

        fontWeight: "600",

        color: "#0f766e",

      }}

    >

      Delivery promise

    </p>

    <p style={{ margin: 0, color: "#374151", fontSize: "14px" }}>

      Free Delivery by <strong>{expectedDeliveryDate}</strong>

    </p>

    <p

      style={{

        margin: "5px 0 0",

        fontSize: "12px",

        color: "#6b7280",

      }}

    >

      Cash on Delivery Available · 7 Days Replacement Policy

    </p>

  </div>

</div>

            {/* Purchase buttons */}

            <div className="pd-actions">

              <button

                className="pd-primary"

                type="button"

                disabled={product.stock <= 0}

                onClick={handleAddToCart}

              >

                Add to Cart

              </button>

              <button

                className="pd-buy"

                type="button"

                disabled={product.stock <= 0}

                onClick={handleBuyNow}

              >

                Buy Now

              </button>

            </div>

            {message && (

              <p className="pd-feedback">

                {message}

              </p>

            )}

            {wishlistMessage && (

              <p className="pd-feedback">

                {wishlistMessage}

              </p>

            )}

            {error && (

              <p className="pd-error">{error}</p>

            )}

          </div>

        </section>

        {/* Specifications */}

        <section className="pd-panel">

          <h2>Product Details &amp; Specifications</h2>

          <p className="pd-long-description">

            {product.description ||

              "No additional description is available."}

          </p>

          <h3 className="pd-subheading">Highlights</h3>

          {productHighlights.length > 0 ? (

            <ul className="pd-highlights">

              {productHighlights.map((highlight, index) => (

                <li key={`${index}-${highlight}`}>{highlight}</li>

              ))}

            </ul>

          ) : (

            <p className="pd-note">No product highlights have been provided.</p>

          )}

          {specificationRows.length > 0 ? (

            <dl className="pd-spec-grid">

              {selectedSpecificationRows.map(([key, value]) => (

                <div key={key}>

                  <dt>

                    {key}

                  </dt>

                  <dd>{String(value)}</dd>

                </div>

              ))}

            </dl>

          ) : (

            <p className="pd-note">

              More specifications can be displayed when

              they are added to your product records.

            </p>

          )}

        </section>

{/* Related products */}

<section className="pd-panel">

  <div

    className="pd-panel-heading"

    style={{

      display: "flex",

      justifyContent: "space-between",

      alignItems: "center",

      gap: "16px",

      flexWrap: "wrap",

    }}

  >

    <h2 style={{ margin: 0 }}>Related Products</h2>

    <button

      type="button"

      onClick={() => navigate("/products")}

      style={{

        padding: "11px 20px",

        backgroundColor: "#0f766e",

        color: "#ffffff",

        border: "none",

        borderRadius: "8px",

        fontWeight: "600",

        fontSize: "14px",

        cursor: "pointer",

        whiteSpace: "nowrap",

      }}

    >

      View All Products

    </button>

  </div>

  {suggestedProducts.length > 0 ? (

    <div className="pd-related-grid">

      {suggestedProducts.map((item) => (

        <button

          className="pd-related-card"

          key={item.id}

          type="button"

          onClick={() => navigate(`/products/${item.id}`)}

        >

          <div className="pd-related-image">

            {item.image ? (

              <img

                src={getImageUrl(item.image)}

                alt={item.name}

                loading="lazy"

              />

            ) : (

              <span>No image</span>

            )}

          </div>

          <strong>{item.name}</strong>

          <span className="pd-related-price">

            ₹{Number(item.price).toLocaleString("en-IN")}

          </span>

          <small>{item.category_name}</small>

        </button>

      ))}

    </div>

  ) : (

    <p className="pd-note">

      No recommendations are available yet.

    </p>

  )}

</section>

        <div

  style={{

    display: "flex",

    justifyContent: "flex-end",

    marginBottom: "20px",

  }}

>

</div>

        {/* Customer reviews */}

        <section className="pd-panel">

          <h2>Customer Reviews</h2>

          {reviews.length === 0 ? (

            <div style={{ padding: "24px 0" }}>
              <p className="pd-note">
                No reviews yet. Only verified buyers can review this product.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "#6b7280" }}>
                Purchase this product and visit <strong>My Orders</strong> to leave a review.
              </p>
            </div>

          ) : (

            reviews.map((review, index) => {

              const reviewRating = Math.max(

                0,

                Math.min(5, Number(review.rating) || 0)

              );

              const reviewImages = review.images || [];
              const coverImage = review.image || null;
              const allImages = [
                ...(coverImage ? [{ image: coverImage }] : []),
                ...reviewImages,
              ];

              return (

                <article

                  className="pd-review"

                  key={review.id || index}

                  style={{ borderBottom: index < reviews.length - 1 ? "1px solid #f3f4f6" : "none", paddingBottom: 18, marginBottom: 18 }}

                >

                  {/* Reviewer header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "#0f766e", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 16, flexShrink: 0,
                      }}>
                        {(review.username || review.user_name || "C")[0].toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ fontSize: 14, color: "#111827", display: "block" }}>
                          {review.username || review.user_name || "Customer"}
                        </strong>
                        {review.is_verified_purchase !== false && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            fontSize: 11, color: "#0f766e", fontWeight: 700,
                          }}>
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
                        : ""}
                    </span>
                  </div>

                  {/* Stars */}
                  <p className="pd-stars" style={{ margin: "6px 0 8px", fontSize: 18, letterSpacing: 1 }}>
                    <span style={{ color: "#f59e0b" }}>{"★".repeat(reviewRating)}</span>
                    <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - reviewRating)}</span>
                  </p>

                  {/* Comment */}
                  <p style={{ margin: "0 0 10px", fontSize: 14, color: "#374151", lineHeight: 1.65 }}>
                    {review.comment}
                  </p>

                  {/* Review photos */}
                  {allImages.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {allImages.map((imgObj, imgIdx) => (
                        <a
                          key={imgIdx}
                          href={imgObj.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}
                          title="View full image"
                        >
                          <img
                            src={imgObj.image}
                            alt={`Review photo ${imgIdx + 1}`}
                            style={{ width: 72, height: 72, objectFit: "cover", display: "block" }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                </article>

              );

            })

          )}

        </section>

        {/* Review note — no open form; reviews submitted from Orders page only */}
        <section className="pd-panel" style={{ background: "#f0fdfa", border: "1px solid #99f6e4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>✍️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f766e" }}>Want to review this product?</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#115e59", lineHeight: 1.5 }}>
                Only verified buyers can submit reviews. After purchasing, go to{" "}
                <a href="/orders" style={{ color: "#0f766e", fontWeight: 700 }}>My Orders</a>{" "}
                and click <strong>"Write a Review"</strong> next to this product.
              </p>
            </div>
          </div>
        </section>

      </div>

    </main>

  );

}

const styles = `

.pd-page {

  min-height: 100vh;

  padding: 28px 0 64px;

  background: #f8fafc;

  color: #111827;

  font-family: Arial, Helvetica, sans-serif;

}

.pd-container {

  max-width: 1240px;

  margin: 0 auto;

  padding: 0 24px;

}

.pd-breadcrumb {

  display: flex;

  gap: 10px;

  align-items: center;

  margin-bottom: 22px;

  color: #64748b;

  font-size: 13px;

}

.pd-breadcrumb button,

.pd-address-title button,

.pd-panel-heading button {

  border: 0;

  background: none;

  color: #0f766e;

  cursor: pointer;

  font-weight: 700;

}

.pd-main-grid {

  display: grid;

  grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);

  gap: 36px;

  align-items: start;

}

.pd-gallery,

.pd-summary {

  min-width: 0;

}

.pd-image-frame {

  position: relative;

  display: flex;

  min-height: 440px;

  align-items: center;

  justify-content: center;

  overflow: hidden;

  border: 1px solid #e2e8f0;

  border-radius: 16px;

  background: white;

}

.pd-main-image {

  display: block;

  box-sizing: border-box;

  width: 100%;

  height: 500px;

  padding: 18px;

  object-fit: contain;

}

.pd-no-image {

  display: grid;

  height: 400px;

  place-items: center;

  color: #64748b;

}

.pd-wish {

  position: absolute;

  top: 12px;

  right: 12px;

  z-index: 5;

  display: flex;

  align-items: center;

  justify-content: center;

  width: 42px;

  height: 42px;

  padding: 0;

  border: 1px solid #e2e8f0;

  border-radius: 50%;

  background: #ffffff;

  color: #64748b;

  font-size: 28px;

  line-height: 1;

  cursor: pointer;

}

.pd-wish span {

  display: block;

  line-height: 1;

}

.pd-wish.active {

  color: #ec4899;

  background: #fce7f3;

}

.pd-arrow {

  position: absolute;

  top: 50%;

  width: 40px;

  height: 40px;

  transform: translateY(-50%);

  border: 1px solid #e2e8f0;

  border-radius: 50%;

  background: white;

  font-size: 26px;

  cursor: pointer;

}

.pd-prev {

  left: 12px;

}

.pd-next {

  right: 12px;

}

.pd-thumbnails {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin-top: 12px;

}

.pd-thumbnails button {

  padding: 3px;

  border: 1px solid #cbd5e1;

  border-radius: 8px;

  background: white;

  cursor: pointer;

}

.pd-thumbnails button.active {

  border: 2px solid #0f766e;

}

.pd-thumbnails img {

  display: block;

  width: 68px;

  height: 68px;

  object-fit: contain;

}

.pd-category {

  margin: 2px 0 10px;

  color: #0f766e;

  font-size: 13px;

  font-weight: 700;

  letter-spacing: .08em;

  text-transform: uppercase;

}

.pd-summary h1 {

  margin: 0 0 15px;

  font-size: clamp(25px, 3vw, 36px);

  line-height: 1.2;

}

.pd-price {

  margin-bottom: 16px;

  font-size: 32px;

  font-weight: 750;

}

.pd-price-label {
  display: block;
  margin-bottom: 3px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.pd-price-discount {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -8px 0 16px;
}

.pd-price-discount del {
  color: #64748b;
}

.pd-price-discount span {
  color: #15803d;
  font-weight: 700;
}

.pd-description,

.pd-long-description {

  color: #475569;

  line-height: 1.7;

}

.pd-stock {

  font-weight: 700;

}

.in-stock {

  color: #15803d;

}

.out-stock,

.pd-error {

  color: #dc2626;

}

.pd-size-box,

.pd-delivery {

  margin: 20px 0;

  padding: 17px;

  border: 1px solid #e2e8f0;

  border-radius: 12px;

  background: white;

}

.pd-size-box h3,

.pd-delivery h3 {

  margin-top: 0;

}

.pd-selector-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pd-selector-heading h3 {
  margin: 0;
}

.pd-size-chart-toggle {
  padding: 5px 9px;
  border: 1px solid #99f6e4;
  border-radius: 6px;
  background: #f0fdfa;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.pd-size-chart-preview {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
}

.pd-size-chart-preview p {
  margin: 7px 0;
  font-weight: 700;
}

.pd-size-chart-preview small {
  color: #64748b;
}

.pd-size-options {

  display: flex;

  flex-wrap: wrap;

  gap: 9px;

  margin: 14px 0;

}

.pd-size-options button {

  min-width: 44px;

  padding: 10px 13px;

  border: 1px solid #cbd5e1;

  border-radius: 8px;

  background: white;

  font-weight: 700;

  cursor: pointer;

}

.pd-variant-box .pd-size-options button {
  display: grid;
  gap: 4px;
  text-align: left;
}

.pd-variant-box .pd-size-options button small {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.pd-size-options button.selected {

  border: 2px solid #0f766e;

  background: #f0fdfa;

  color: #115e59;

}

.pd-size-box small,

.pd-note {

  color: #64748b;

  font-size: 12px;

  line-height: 1.6;

}

.pd-pincode-form {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.pd-pincode-form input,

.pd-address-form input,

.pd-review-form select,

.pd-review-form textarea {

  box-sizing: border-box;

  width: 100%;

  min-width: 0;

  padding: 11px 12px;

  border: 1px solid #cbd5e1;

  border-radius: 7px;

  background: white;

  font: inherit;

}

.pd-pincode-form button {
  flex-shrink: 0;
  min-width: max-content;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: #f0fdfa;
  color: #0f766e;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  cursor: pointer;
}

.pd-address-title {

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 12px;

  margin-top: 20px;

}

.pd-address-list {

  display: grid;

  gap: 9px;

  margin-top: 12px;

}

.pd-address-option {

  display: flex;

  align-items: flex-start;

  gap: 9px;

  padding: 11px;

  border: 1px solid #e2e8f0;

  border-radius: 8px;

  font-size: 13px;

  line-height: 1.6;

  cursor: pointer;

}

.pd-address-option.chosen {

  border-color: #0f766e;

  background: #f0fdfa;

}

.pd-address-form {

  display: grid;

  gap: 9px;

  margin-top: 12px;

}

.pd-actions {

  display: flex;

  gap: 12px;

  margin-top: 20px;

}

.pd-primary,

.pd-buy {

  flex: 1;

  padding: 14px 22px;

  border: 0;

  border-radius: 8px;

  color: white;

  font-size: 15px;

  font-weight: 700;

  cursor: pointer;

}

.pd-primary {

  background: #111827;

}

.pd-buy {

  background: #ea580c;

}

.pd-primary:disabled,

.pd-buy:disabled {

  background: #94a3b8;

  cursor: not-allowed;

}

.pd-feedback {

  color: #0f766e;

  font-size: 13px;

  line-height: 1.6;

}

.pd-panel {

  min-width: 0;

  margin-top: 32px;

  padding: 25px;

  border: 1px solid #e2e8f0;

  border-radius: 14px;

  background: white;

}

.pd-panel h2 {

  margin: 0 0 17px;

  font-size: 23px;

}

.pd-spec-grid {

  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 0 24px;

  margin-top: 20px;

}

.pd-subheading {
  margin: 22px 0 10px;
  color: #1f2937;
  font-size: 16px;
}

.pd-highlights {
  display: grid;
  gap: 8px;
  margin: 0 0 22px;
  padding-left: 20px;
  color: #374151;
  line-height: 1.55;
}

.pd-active-location {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.pd-active-location strong {
  color: #0f172a;
}

.pd-delivery-promises {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 12px 0;
  padding: 0;
  color: #334155;
  font-size: 12px;
  list-style: none;
}

.pd-delivery-promises li::before {
  content: "✓";
  margin-right: 6px;
  color: #0f766e;
  font-weight: 800;
}

.pd-spec-grid div {

  display: grid;

  grid-template-columns: minmax(100px, .8fr) minmax(0, 1.2fr);

  gap: 12px;

  padding: 12px 0;

  border-bottom: 1px solid #f1f5f9;

}

.pd-spec-grid dt {

  color: #64748b;

  font-size: 13px;

}

.pd-spec-grid dd {

  margin: 0;

  overflow-wrap: anywhere;

  font-size: 13px;

}

.pd-panel-heading {

  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 12px;

}

.pd-related-grid {

  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr));

  gap: 16px;

  align-items: stretch;

}

.pd-related-card {

  display: flex;

  flex-direction: column;

  align-items: stretch;

  gap: 0;

  min-width: 0;

  padding: 0;

  overflow: hidden;

  border: 1px solid #e2e8f0;

  border-radius: 12px;

  background: #ffffff;

  color: #111827;

  text-align: left;

  cursor: pointer;

  position: relative;

}

.pd-related-card:hover {

  border-color: #0f766e;

  box-shadow: 0 4px 16px #0f766e12;

}

.pd-related-image {

  position: relative;

  display: flex;

  flex: 0 0 190px;

  width: 100%;

  height: 190px;

  box-sizing: border-box;

  align-items: center;

  justify-content: center;

  overflow: hidden;

  padding: 12px;

  background: #f8fafc;

}

.pd-related-image img {

  position: static !important;

  display: block;

  width: 100%;

  height: 100%;

  max-width: 100%;

  max-height: 100%;

  object-fit: contain;

  padding: 0;

  margin: 0;

}

.pd-related-card strong {

  position: static !important;

  display: -webkit-box;

  min-height: 40px;

  margin: 12px 12px 6px;

  overflow: hidden;

  color: #111827;

  font-size: 14px;

  line-height: 1.4;

  overflow-wrap: anywhere;

  -webkit-line-clamp: 2;

  -webkit-box-orient: vertical;

}

.pd-related-price {

  margin: 0 12px 8px;

  color: #0f766e;

  font-size: 16px;

  font-weight: 700;

}

.pd-related-card small {

  margin: 0 12px 12px;

  color: #64748b;

  font-size: 12px;

}

@media (max-width: 850px) {

  .pd-related-grid {

    grid-template-columns: repeat(3, minmax(0, 1fr));

  }

}

@media (max-width: 560px) {

  .pd-related-grid {

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 10px;

  }

  .pd-related-image {

    flex-basis: 145px;

    height: 145px;

  }

}

.pd-review {

  padding: 15px 0;

  border-bottom: 1px solid #e2e8f0;

}

.pd-review p {

  line-height: 1.6;

}

.pd-stars {

  color: #d97706;

}

.pd-review-form {

  display: grid;

  gap: 15px;

  max-width: 700px;

}

.pd-review-form label {

  display: grid;

  gap: 8px;

  font-weight: 600;

}

.pd-review-form select {

  width: auto;

  max-width: 220px;

}

.pd-review-form textarea {

  resize: vertical;

}

@media (max-width: 850px) {

  .pd-main-grid {

    grid-template-columns: 1fr;

    gap: 25px;

  }

  .pd-image-frame {

    min-height: 320px;

  }

  .pd-main-image {

    height: 420px;

  }

  .pd-related-grid {

    grid-template-columns: repeat(3, minmax(0, 1fr));

  }

}

@media (max-width: 560px) {

  .pd-container {

    padding: 0 13px;

  }

  .pd-page {

    padding-top: 16px;

  }

  .pd-image-frame {

    min-height: 260px;

  }

  .pd-main-image {

    height: 320px;

    padding: 10px;

  }

  .pd-summary h1 {

    font-size: 26px;

  }

  .pd-price {

    font-size: 28px;

  }

  .pd-panel {

    margin-top: 20px;

    padding: 16px;

  }

  .pd-spec-grid {

    grid-template-columns: 1fr;

  }

  .pd-related-grid {

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 9px;

  }

  .pd-related-image {

    height: 145px;

  }

  .pd-actions {

    flex-direction: column;

  }

  .pd-panel-heading {

    align-items: flex-start;

  }

}


@media (max-width: 760px) {
  .pd-pincode-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .pd-pincode-form input {
    grid-column: 1 / -1;
    width: 100%;
    min-height: 44px;
  }
  .pd-pincode-form button {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 8px 10px;
    white-space: nowrap;
    font-size: 14px;
  }
}

@media (max-width: 560px) {
  .pd-delivery { padding: 14px; margin: 16px 0; }
  .pd-address-title { align-items: flex-start; flex-wrap: wrap; gap: 8px; }
  .pd-address-title h4, .pd-address-title h3 { min-width: 0; }
  .pd-address-option { min-width: 0; overflow-wrap: anywhere; }
  .pd-address-form { grid-template-columns: minmax(0, 1fr); }
  .pd-address-form input, .pd-address-form button { width: 100%; min-width: 0; }
}

/* Desktop and tablet fix: keep delivery controls from squeezing button labels. */
.pd-pincode-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content max-content;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.pd-pincode-form input {
  width: 100%;
  min-width: 0;
}

.pd-pincode-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: none;
  min-width: max-content;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
  padding: 10px 12px;
}

@media (min-width: 561px) and (max-width: 900px) {
  .pd-pincode-form {
    grid-template-columns: minmax(0, 1fr) max-content;
  }

  .pd-pincode-form input {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .pd-pincode-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .pd-pincode-form input {
    grid-column: 1 / -1;
  }

  .pd-pincode-form button {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    white-space: nowrap;
    padding: 10px 6px;
    font-size: 13px;
  }
}

`;

export default ProductDetails;
