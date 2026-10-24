
import { useEffect, useLayoutEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

const CLOTHING_SIZES = [

  "XS",

  "S",

  "M",

  "L",

  "XL",

  "XXL",

];

const SHOE_SIZES = [

  "6",

  "7",

  "8",

  "9",

  "10",

  "11",

  "12",

];

function getImageUrl(image) {

  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {

    return image;

  }

  return `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`}${

    image.startsWith("/") ? "" : "/"

  }${image}`;

}

function isFashionProduct(product) {

  const category = String(

    product?.category_name ||

    product?.category?.name ||

    ""

  )

    .toLowerCase()

    .replace(/[_-]/g, " ");

  const name = String(

    product?.name || product?.title || ""

  )

    .toLowerCase()

    .replace(/[_-]/g, " ");

  const clothingCategory =

    /\b(clothing|fashion|apparel|women|womens|women's|ladies|girls|mens wear|womens wear|tops|bottoms|ethnic wear)\b/.test(category);

  const clothingName =

    /\b(tops?|t shirts?|tshirts?|shirts?|blouses?|tunics?|trousers|pants|jeans|leggings|joggers|dresses|kurtis|kurtas|sarees|hoodies|jackets|sweaters|skirts|shorts|lehenga|suits|coats|nightwear|pajamas|pyjamas|track pants)\b/.test(name);

  return clothingCategory || clothingName;

}

function isFootwear(product) {

  const text = [

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

  return /\b(shoes?|sneakers?|footwear|sandals?|boots?|slippers?|loafers?|heels?|flip flops|trainers?)\b/.test(text);

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

  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [reviewMessage, setReviewMessage] = useState("");

  const [selectedSize, setSelectedSize] = useState("");

  const [pincode, setPincode] = useState("");

  const [deliveryMessage, setDeliveryMessage] = useState("");

  const expectedDeliveryDate = (() => {

  const date = new Date();

  date.setDate(date.getDate() + 6);

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

const showClothingSizes =

  isFashionProduct(product) && !showShoeSizes;

const availableSizes = showShoeSizes

  ? SHOE_SIZES

  : showClothingSizes

    ? CLOTHING_SIZES

    : [];

    console.log("Product:", product);

console.log("Shoe detected:", showShoeSizes);

console.log("Sizes:", availableSizes);


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

  const isFashion = isFashionProduct(product);

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

  // Display available scalar product fields as specifications.

  const excludedFields = [

    "id",

    "name",

    "price",

    "description",

    "image",

    "images",

    "stock",

    "created_at",

    "updated_at",

  ];

  const specifications = product

    ? Object.entries(product).filter(

        ([key, value]) =>

          !excludedFields.includes(key) &&

          value !== null &&

          value !== "" &&

          typeof value !== "object"

      )

    : [];

  // Add item to cart. Guests use localStorage; signed-in users use the API.
  const handleAddToCart = async () => {
    setMessage("");
    setError("");

    if (isFashion && !selectedSize) {
      setMessage("Please select a size first.");
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

    const addToGuestCart = () => {
      const storageKey = "nexora_guest_cart";
      const guestCart = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const size = isFashion ? selectedSize : "";
      const existing = guestCart.find(
        (item) =>
          String(item.product) === String(product.id) &&
          String(item.selected_size || "") === String(size)
      );

      if (existing) {
        existing.quantity = Math.min(
          Number(existing.quantity || 1) + 1,
          Number(product.stock)
        );
      } else {
        guestCart.push({
          id: `guest-${product.id}-${size || "default"}`,
          product: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image || "",
          quantity: 1,
          selected_size: size,
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
        ...(isFashion ? { selected_size: selectedSize } : {}),
      });
      setMessage("Product added to cart!");
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

  navigate("/checkout", {

    state: {

      buyNowProduct: {

        ...product,

        quantity: 1,

        ...(availableSizes.length > 0

          ? { selected_size: selectedSize }

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
  };

  // Look up Indian postal details for a valid six-digit pincode.

  const handleCheckDelivery = async (event) => {

    event.preventDefault();

    setDeliveryMessage("");

    if (!/^\d{6}$/.test(pincode)) {

      setDeliveryMessage("Enter a valid 6-digit Indian pincode.");

      return;

    }

    try {

      const response = await fetch(

        `https://api.postalpincode.in/pincode/${pincode}`

      );

      const data = await response.json();

      const result = data?.[0];

      if (result?.Status === "Success" && result.PostOffice?.length) {

        const office = result.PostOffice[0];

        setDeliveryMessage(

          `Pincode found: ${office.Name}, ${office.District}, ${office.State}. This lookup does not confirm delivery serviceability.`

        );

      } else {

        setDeliveryMessage("Pincode not found. Please check it and try again.");

      }

    } catch (err) {

      console.error("Pincode lookup error:", err);

      setDeliveryMessage("Could not look up this pincode. Please try again.");

    }

  };

  // Detect browser location and attempt to retrieve its postal code.

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

          const postcode = String(data?.address?.postcode || "").replace(/\D/g, "");

          if (/^\d{6}$/.test(postcode)) {

            setPincode(postcode);

            const area =

              data.address.suburb ||

              data.address.city ||

              data.address.town ||

              data.address.village ||

              "your nearby area";

            setDeliveryMessage(

              `Location detected near ${area}. Pincode ${postcode} filled in; press Check to look up postal details.`

            );

          } else {

            setDeliveryMessage(

              "Location detected, but a six-digit pincode was not found. Please enter it manually."

            );

          }

        } catch (err) {

          console.error("Location lookup error:", err);

          setDeliveryMessage("Could not retrieve a pincode for your location. Please enter it manually.");

        }

      },

      (err) => {

        console.error("Browser geolocation error:", err);

        setDeliveryMessage("Location permission was denied or unavailable. Please enter your pincode manually.");

      },

      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }

    );

  };

  // Submit review.

  const handleSubmitReview = async (event) => {

    event.preventDefault();

    setReviewMessage("");

    try {

      const response = await api.post(

        `/reviews/products/${id}/`,

        {

          product: Number(id),

          rating: Number(rating),

          comment,

        }

      );

      setReviews((current) => [

        response.data,

        ...current,

      ]);

      setComment("");

      setRating(5);

      setReviewMessage(

        "Review submitted successfully!"

      );

    } catch (err) {

      console.error(

        "Review error:",

        err.response?.data || err

      );

      const data = err.response?.data;

      setReviewMessage(

        data?.detail ||

          data?.non_field_errors?.[0] ||

          data?.rating?.[0] ||

          data?.comment?.[0] ||

          "Failed to submit review."

      );

    }

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

            <h1>{product.name}</h1>

            <div className="pd-price">

              ₹

              {Number(product.price).toLocaleString(

                "en-IN"

              )}

            </div>

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

            {/* Fashion size selector */}

            {availableSizes.length > 0 && (

              <section className="pd-size-box">

                <h3>Select Size</h3>

                <div className="pd-size-options">

                  {availableSizes.map((size) => (

                    <button

                      key={size}

                      type="button"

                      className={

                        selectedSize === size ? "selected" : ""

                      }

                      onClick={() => setSelectedSize(size)}

                    >

                      {size}

                    </button>

                  ))}

                </div>

                <small>

                  Select your preferred size before ordering.

                  Confirm the size chart for the specific product.

                </small>

              </section>

            )}

            {/* Delivery and address selector */}

            <section className="pd-delivery">

              <h3>Delivery Address</h3>

              <form

                className="pd-pincode-form"

                onSubmit={handleCheckDelivery}

              >

                <input

                  value={pincode}

                  maxLength={6}

                  inputMode="numeric"

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

                <button type="button" onClick={handleDetectLocation}>Detect location</button>

              </form>

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

      Expected Delivery

    </p>

    <p style={{ margin: 0, color: "#374151", fontSize: "14px" }}>

      Get it by <strong>{expectedDeliveryDate}</strong>

    </p>

    <p

      style={{

        margin: "5px 0 0",

        fontSize: "12px",

        color: "#6b7280",

      }}

    >

      Estimated delivery in 5–7 days

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

          <h2>Product Details</h2>

          <p className="pd-long-description">

            {product.description ||

              "No additional description is available."}

          </p>

          {specifications.length > 0 ? (

            <dl className="pd-spec-grid">

              {specifications.map(([key, value]) => (

                <div key={key}>

                  <dt>

                    {key

                      .replaceAll("_", " ")

                      .replace(/\b\w/g, (letter) =>

                        letter.toUpperCase()

                      )}

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

            <p className="pd-note">

              No reviews yet. Be the first to review

              this product.

            </p>

          ) : (

            reviews.map((review, index) => {

              const reviewRating = Math.max(

                0,

                Math.min(5, Number(review.rating) || 0)

              );

              return (

                <article

                  className="pd-review"

                  key={review.id || index}

                >

                  <strong>

                    {review.username ||

                      review.user_name ||

                      "Customer"}

                  </strong>

                  <p className="pd-stars">

                    {"★".repeat(reviewRating)}

                    {"☆".repeat(5 - reviewRating)}

                  </p>

                  <p>{review.comment}</p>

                </article>

              );

            })

          )}

        </section>

        {/* Review form */}

        <section className="pd-panel">

          <h2>Write a Review</h2>

          <form

            className="pd-review-form"

            onSubmit={handleSubmitReview}

          >

            <label>

              Rating

              <select

                value={rating}

                onChange={(event) =>

                  setRating(event.target.value)

                }

              >

                <option value="5">5 - Excellent</option>

                <option value="4">4 - Very Good</option>

                <option value="3">3 - Good</option>

                <option value="2">2 - Fair</option>

                <option value="1">1 - Poor</option>

              </select>

            </label>

            <label>

              Your Review

              <textarea

                value={comment}

                onChange={(event) =>

                  setComment(event.target.value)

                }

                rows={4}

                placeholder="Share your experience"

                required

              />

            </label>

            <button

              className="pd-primary"

              type="submit"

            >

              Submit Review

            </button>

            {reviewMessage && (

              <p className="pd-feedback">

                {reviewMessage}

              </p>

            )}

          </form>

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
