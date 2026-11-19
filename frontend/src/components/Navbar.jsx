import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  UserRound,
  ShoppingCart,
  Heart,
  Search,
  MapPin,
  LocateFixed,
  ShoppingBag,
  Home as HomeIcon,
  Laptop,
  Smartphone,
  Tv,
  Shirt,
  Baby,
  Sofa,
  Sparkles,
  Dumbbell,
  CircleHelp,
  X,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { productMatchesSearch } from "../utils/productSearch";
import api from "../services/api";
import { getCachedProducts } from "../utils/productCatalogCache";
import {
  getSavedDeliveryLocation,
  lookupIndianPincode,
  saveDeliveryLocation as persistDeliveryLocation,
} from "../utils/deliveryLocation";

const DELIVERY_LOCATION_EVENT = "nexora:delivery-location-change";

function getLocationLabel(location) {
  const placeNames = [location.area, location.city]
    .map((value) => String(value || "").trim())
    .filter(
      (value, index, values) =>
        value && values.findIndex((other) => other.toLowerCase() === value.toLowerCase()) === index
    );
  const place = placeNames.join(", ") || location.country || "India";
  return `${place}${location.pincode ? ` ${location.pincode}` : ""}`;
}

function getStoredDeliveryLocation() {
  const saved = getSavedDeliveryLocation();
  return { ...saved, label: saved.label || getLocationLabel(saved) };
}

function getAddressLocation(address) {
  if (address && typeof address === "object") {
    const addressLine = String(
      address.address_line || address.address || address.shipping_address || ""
    );
    return {
      area:
        address.area ||
        addressLine.split(/[,\n]/).map((part) => part.trim()).filter(Boolean)[0] ||
        "",
      city: address.city || "",
      state: address.state || "",
      pincode: String(address.pincode || address.postal_code || ""),
    };
  }

  const lines = String(address || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const locationLine = lines[lines.length - 1] || "";
  const pin = locationLine.match(/\b([1-9]\d{5})\b/);
  const placeParts = locationLine
    .replace(pin?.[0] || "", "")
    .split(/[,-]/)
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    area: placeParts.length > 2 ? placeParts.slice(0, -2).join(", ") : "",
    city: placeParts.length > 1 ? placeParts[placeParts.length - 2] : placeParts[0] || "",
    state: placeParts.length > 1 ? placeParts[placeParts.length - 1] : "",
    pincode: pin?.[1] || "",
  };
}

// Keep these category values aligned with your Products page.
const categories = [
  { label: "Electronics", value: "Electronics", Icon: Laptop },
  { label: "Mobiles", value: "Mobiles", Icon: Smartphone },
  { label: "TVs & Appliances", value: "TVs & Appliances", Icon: Tv },
  { label: "Men's Fashion", value: "Men's Fashion", Icon: Shirt },
  { label: "Women's Fashion", value: "Women's Fashion", Icon: ShoppingBag },
  { label: "Kids", value: "Kids", Icon: Baby },
  { label: "Home & Living", value: "Home & Living", Icon: Sofa },
  { label: "Beauty", value: "Beauty & Personal Care", Icon: Sparkles },
  { label: "Sports", value: "Sports & Fitness", Icon: Dumbbell },
];

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [searchTerm, setSearchTerm] = useState(() => params.get("search") || "");
  const [products, setProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [locationOpen, setLocationOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState(
    getStoredDeliveryLocation
  );
  const country = deliveryLocation.country || "India";
  const pinCode = deliveryLocation.pincode || "";

  const [draftCountry, setDraftCountry] = useState(country);
  const [draftPinCode, setDraftPinCode] = useState(pinCode);
  const [locationError, setLocationError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [savedAddressLoading, setSavedAddressLoading] = useState(false);
  const [pinLookup, setPinLookup] = useState({
    pin: "",
    status: "idle",
    area: "",
    district: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    const updateLocation = (event) => {
      setDeliveryLocation(
        event.detail && typeof event.detail === "object"
          ? event.detail
          : getStoredDeliveryLocation()
      );
    };
    window.addEventListener("storage", updateLocation);
    window.addEventListener(DELIVERY_LOCATION_EVENT, updateLocation);
    window.addEventListener("nexora:location-updated", updateLocation);
    return () => {
      window.removeEventListener("storage", updateLocation);
      window.removeEventListener(DELIVERY_LOCATION_EVENT, updateLocation);
      window.removeEventListener("nexora:location-updated", updateLocation);
    };
  }, []);

  // Fetch Indian postal details after the user finishes typing a valid PIN.
  useEffect(() => {
    const cleanPin = draftPinCode.trim();
    if (draftCountry !== "India" || !/^[1-9]\d{5}$/.test(cleanPin)) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setPinLookup({
        pin: cleanPin,
        status: "loading",
        area: "",
        district: "",
        city: "",
        state: "",
      });
      try {
        const location = await lookupIndianPincode(cleanPin, {
          signal: controller.signal,
        });
        setPinLookup({
          pin: cleanPin,
          status: location.source === "india-post" ? "success" : "unavailable",
          area: location.area,
          district: location.city,
          city: location.city,
          state: location.state,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("PIN code lookup failed:", error);
          setPinLookup({
            pin: cleanPin,
            status: "unavailable",
            area: "",
            district: "",
            city: "",
            state: "",
          });
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [draftCountry, draftPinCode]);

  useEffect(() => {
    if (!locationOpen || !isAuthenticated) return undefined;

    let active = true;
    (async () => {
      let locations = [];
      try {
        const addressResponse = await api.get("/accounts/addresses/");
        const addresses =
          addressResponse.data?.results || addressResponse.data || [];
        locations = Array.isArray(addresses)
          ? addresses
              .map((address) => {
                const location = getAddressLocation(address);
                return {
                  ...location,
                  label: getLocationLabel({
                    ...location,
                    country: "India",
                  }),
                  sourceLabel: address.is_default
                    ? "Default saved address"
                    : address.full_name || "Saved address",
                };
              })
              .filter((address) =>
                /^[1-9]\d{5}$/.test(String(address.pincode).trim())
              )
          : [];
      } catch (error) {
        console.warn(
          "Could not load saved addresses:",
          error.response?.data || error
        );
      }

      if (locations.length === 0) {
        try {
          const orderResponse = await api.get("/orders/");
          const orders = orderResponse.data?.results || orderResponse.data || [];
          if (Array.isArray(orders)) {
            const recentOrder = orders.find(
              (order) => order.shipping_address
            );
            if (recentOrder) {
              const location = getAddressLocation(recentOrder.shipping_address);
              if (/^[1-9]\d{5}$/.test(String(location.pincode).trim())) {
                locations = [
                  {
                    ...location,
                    label: getLocationLabel({
                      ...location,
                      country: "India",
                    }),
                    sourceLabel: "From a recent order",
                  },
                ];
              }
            }
          }
        } catch (error) {
          console.error(
            "Could not load recent order address:",
            error.response?.data || error
          );
        }
      }
      if (active) {
        setSavedAddresses(locations.slice(0, 3));
        setSavedAddressLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthenticated, locationOpen]);

  const currentPinLookup =
    pinLookup.pin === draftPinCode.trim() && draftCountry === "India"
      ? pinLookup
      : {
          pin: draftPinCode.trim(),
          status: "idle",
          area: "",
          district: "",
          city: "",
          state: "",
        };

  // Load cached catalog data for search suggestions.
  useEffect(() => {
    let active = true;
    getCachedProducts(api)
      .then((list) => {
        if (active) setProducts(list);
      })
      .catch((error) => {
        console.error("Failed to load navbar products:", error);
        if (active) setProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const rawQuery = searchTerm.trim().toLowerCase();
    if (!rawQuery) return [];

    return products
      .filter((product) => {
        const categoryValue =
          product.category_name ||
          (typeof product.category === "object"
            ? product.category?.name || product.category?.title || product.category?.slug
            : product.category) ||
          "";
        return productMatchesSearch(product, rawQuery, String(categoryValue));
      })
      .slice(0, 6);
  }, [products, searchTerm]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setShowSuggestions(false);
    const search = searchTerm.trim();
    const queryParams = new URLSearchParams();
    if (search) queryParams.set("search", search);

    navigate({
      pathname: "/products",
      search: queryParams.toString() ? `?${queryParams.toString()}` : "",
    });
  };

  const selectSuggestion = (product) => {
    setShowSuggestions(false);
    setSearchTerm(
      product.name ||
        product.title ||
        product.product_name ||
        product.productName ||
        ""
    );

    if (product.id != null) {
      navigate(`/products/${product.id}`);
    } else {
      const queryParams = new URLSearchParams();
      queryParams.set(
        "search",
        product.name ||
          product.title ||
          product.product_name ||
          product.productName ||
          searchTerm
      );
      navigate(`/products?${queryParams.toString()}`);
    }
  };

  const saveDeliveryLocation = (value) => {
    let nextLocation;
    try {
      nextLocation = persistDeliveryLocation({
      country: value.country || "India",
      area: value.area || "",
      city: value.city || "",
      state: value.state || "",
      pincode: value.pincode || "",
      label: value.label || getLocationLabel(value),
      });
    } catch (error) {
      console.error("Could not save delivery location:", error);
      setLocationError("Could not save your location. Please try again.");
      return false;
    }

    setDeliveryLocation(nextLocation);
    window.dispatchEvent(
      new CustomEvent(DELIVERY_LOCATION_EVENT, { detail: nextLocation })
    );
    setLocationError("");
    setSavedAddressLoading(false);
    setLocationOpen(false);
    return true;
  };

  const selectSavedAddress = (address) => {
    const nextLocation = {
      country: "India",
      area: address.area || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode,
    };
    setDraftCountry("India");
    setDraftPinCode(address.pincode);
    saveDeliveryLocation(nextLocation);
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Location detection is not supported by this browser.");
      return;
    }

    setLocationError("");
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const query = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            localityLanguage: "en",
          });
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`
          );
          if (!response.ok) {
            throw new Error("Could not look up your current location.");
          }

          const result = await response.json();
          const pincode = String(result.postcode || "")
            .replace(/\D/g, "")
            .slice(0, 6);
          if (result.countryCode !== "IN") {
            throw new Error("Automatic delivery detection is available for India.");
          }
          if (!/^[1-9]\d{5}$/.test(pincode)) {
            throw new Error(
              "We could not find a valid Indian PIN code nearby. Enter it below."
            );
          }

          const area = result.locality || "";
          const city =
            result.city ||
            result.locality ||
            result.localityInfo?.administrative?.[0]?.name ||
            "";
          const state = result.principalSubdivision || "";
          setDraftCountry("India");
          setDraftPinCode(pincode);
          setPinLookup({
            pin: pincode,
            status: "success",
            area,
            district: city,
            city,
            state,
          });
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setLocationError(
            error.message ||
              "Could not detect your address. Enter your PIN code manually."
          );
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        setLocationError(
          error.code === 1
            ? "Location permission was denied. Enter your PIN code manually."
            : "Could not access your current location. Enter your PIN code manually."
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  };

  const applyLocation = (event) => {
    event.preventDefault();
    const cleanPin = draftPinCode.trim();
    const validPin =
      draftCountry === "India"
        ? /^[1-9]\d{5}$/.test(cleanPin)
        : /^\d{6}$/.test(cleanPin);
    if (!validPin) {
      setLocationError("Enter a valid 6-digit PIN code.");
      return;
    }
    if (
      draftCountry === "India" &&
      ["idle", "loading"].includes(currentPinLookup.status)
    ) {
      setLocationError("Please wait while we look up this PIN code.");
      return;
    }
    if (draftCountry === "India" && currentPinLookup.status === "invalid") {
      setLocationError("PIN code not found. Please check the 6 digits.");
      return;
    }

    saveDeliveryLocation({
      country: draftCountry,
      pincode: cleanPin,
      area:
        draftCountry === "India" && currentPinLookup.status === "success"
          ? currentPinLookup.area
          : "",
      city:
        draftCountry === "India" && currentPinLookup.status === "success"
          ? currentPinLookup.city || currentPinLookup.district
          : "",
      state:
        draftCountry === "India" && currentPinLookup.status === "success"
          ? currentPinLookup.state
          : "",
    });
  };

  const categoryIsActive = (value) =>
    location.pathname === "/products" &&
    (params.get("category") || "").trim().toLowerCase() ===
      value.trim().toLowerCase();

  const isProductsPage = location.pathname === "/products";
  const isHome = location.pathname === "/";
  const isAllProducts =
    isProductsPage && !params.get("category") && !params.get("search");

  const navClass = (active) => `nexora-nav-link${active ? " active" : ""}`;

  return (
    <>
      <header className="nexora-header">
        <div className="nexora-main-header">
          <Link to="/" className="nexora-logo" aria-label="Nexora home">
            Nexora<span>.</span>
          </Link>

          <button
            type="button"
            className="nexora-delivery"
            onClick={() => {
              setDraftCountry(country);
              setDraftPinCode(pinCode);
              setLocationError("");
              setSavedAddressLoading(isAuthenticated);
              setLocationOpen(true);
            }}
            aria-label="Choose delivery location"
          >
            <MapPin size={21} />
            <span className="nexora-delivery-copy">
              <small>Deliver to</small>
              <strong>
                {deliveryLocation.label || getLocationLabel(deliveryLocation)}
              </strong>
            </span>
            <ChevronRight className="nexora-delivery-chevron" size={14} />
          </button>

          <form
            className="nexora-search"
            onSubmit={handleSearch}
            role="search"
          >
            <input
              type="text"
              aria-label="Search products"
              placeholder="Search Nexora products..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setShowSuggestions(false);
              }}
              autoComplete="off"
            />

            {searchTerm && (
              <button
                type="button"
                className="nexora-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchTerm("");
                  setShowSuggestions(false);
                }}
              >
                <X size={16} />
              </button>
            )}

            <button type="submit" aria-label="Search">
              <Search size={21} />
            </button>

            {showSuggestions && searchTerm.trim() && (
              <div className="nexora-suggestions">
                {suggestions.length > 0 ? (
                  <>
                    <div className="nexora-suggestions-heading">
                      Suggested products
                    </div>
                    {suggestions.map((product, index) => (
                      <button
                        type="button"
                        className="nexora-suggestion"
                        key={
                          product.id ??
                          `${product.name || product.title}-${index}`
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(product)}
                      >
                        <span className="nexora-suggestion-icon">
                          <Search size={15} />
                        </span>
                        <span className="nexora-suggestion-copy">
                          <strong>
                            {product.name ||
                              product.title ||
                              product.product_name ||
                              product.productName ||
                              "Product"}
                          </strong>
                          {(product.category_name || product.category) && (
                            <small>
                              {product.category_name || product.category}
                            </small>
                          )}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    <button
                      type="submit"
                      className="nexora-view-all"
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      Search for “{searchTerm.trim()}”
                    </button>
                  </>
                ) : (
                  <div className="nexora-no-suggestions">
                    No matching products yet. Press Enter to search all products.
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="nexora-account-links">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="nexora-icon-link">
                  <UserRound size={21} />
                  <span>Account</span>
                </Link>
                <Link to="/orders" className="nexora-icon-link">
                  Orders
                </Link>
                <Link
                  to="/wishlist"
                  className="nexora-icon-link"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart size={21} />
                  <span>Wishlist</span>
                </Link>
              </>
            ) : (
              <Link to="/login" className="nexora-icon-link">
                <UserRound size={21} />
                <span>Sign in</span>
              </Link>
            )}

            <Link
              to="/cart"
              className="nexora-icon-link"
              aria-label="Shopping cart"
              title="Shopping cart"
            >
              <ShoppingCart size={25} />
              <span>Cart</span>
            </Link>
          </div>
        </div>

        <nav className="nexora-category-nav" aria-label="Product categories">
          <Link
            to="/products"
            className={navClass(isAllProducts)}
          >
            <span className="nexora-category-icon">
              <ShoppingBag size={16} aria-hidden="true" />
            </span>
            <span className="nexora-category-label">All Products</span>
          </Link>
          <Link to="/" className={navClass(isHome)}>
            <span className="nexora-category-icon">
              <HomeIcon size={16} aria-hidden="true" />
            </span>
            <span className="nexora-category-label">Home</span>
          </Link>
          {categories.map(({ label, value, Icon }) => (
            <Link
              key={value}
              to={`/products?category=${encodeURIComponent(value)}`}
              className={navClass(categoryIsActive(value))}
            >
              <span className="nexora-category-icon">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="nexora-category-label">{label}</span>
            </Link>
          ))}
          <div className="nexora-nav-spacer" />
          <Link
            to="/faq"
            className={`${navClass(location.pathname === "/faq")} nexora-nav-utility`}
          >
            <CircleHelp size={15} aria-hidden="true" />
            <span>FAQ</span>
          </Link>
          <Link
            to="/contact"
            className={`${navClass(location.pathname === "/contact")} nexora-nav-utility`}
            title="Contact Us"
          >
            <Headphones size={15} aria-hidden="true" />
            <span>Contact Us</span>
          </Link>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="nexora-logout"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/register"
              className={`${navClass(location.pathname === "/register")} nexora-nav-utility`}
            >
              <UserRound size={15} aria-hidden="true" />
              Create Account
            </Link>
          )}
        </nav>
      </header>

      {locationOpen && (
        <div
          className="nexora-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSavedAddressLoading(false);
              setLocationOpen(false);
            }
          }}
        >
          <section
            className="nexora-location-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nexora-location-title"
          >
            <div className="nexora-modal-header">
              <div>
                <span className="nexora-modal-eyebrow">
                  <MapPin size={15} /> DELIVERY PREFERENCES
                </span>
                <h2 id="nexora-location-title">Choose your location</h2>
                <p>Check product availability and delivery options near you.</p>
              </div>
              <button
                type="button"
                className="nexora-modal-close"
                onClick={() => {
                  setSavedAddressLoading(false);
                  setLocationOpen(false);
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <button
              type="button"
              className="nexora-detect-location"
              onClick={detectCurrentLocation}
              disabled={detectingLocation}
            >
              <LocateFixed size={17} aria-hidden="true" />
              {detectingLocation
                ? "Detecting your location…"
                : "Use my current location"}
            </button>

            {isAuthenticated && (
              <div className="nexora-saved-addresses">
                <span className="nexora-saved-address-heading">
                  Select Saved Address
                </span>
                {savedAddressLoading ? (
                  <p className="nexora-pin-status">Loading saved addresses…</p>
                ) : savedAddresses.length ? (
                  savedAddresses.map((address, index) => (
                    <button
                      type="button"
                      className="nexora-saved-address"
                      key={address.id || `${address.pincode}-${index}`}
                      onClick={() => selectSavedAddress(address)}
                    >
                      <MapPin size={16} aria-hidden="true" />
                      <span>
                        <strong>{address.label}</strong>
                        <small>{address.sourceLabel}</small>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  ))
                ) : (
                  <p className="nexora-pin-status">
                    No saved delivery address found yet.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={applyLocation}>
              <label className="nexora-field-label" htmlFor="nexora-country">
                Country or region
              </label>
              <select
                id="nexora-country"
                value={draftCountry}
                onChange={(event) => setDraftCountry(event.target.value)}
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Singapore">Singapore</option>
              </select>

              <label className="nexora-field-label" htmlFor="nexora-pin">
                6-digit PIN code
              </label>
              <input
                id="nexora-pin"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder="e.g. 500072"
                value={draftPinCode}
                onChange={(event) => {
                  setDraftPinCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6)
                  );
                  setLocationError("");
                }}
              />

              {currentPinLookup.status === "loading" && (
                <p className="nexora-pin-status">Looking up PIN code…</p>
              )}

              {currentPinLookup.status === "success" && (
                <div className="nexora-pin-result">
                  <MapPin size={16} />
                  <span>
                    <strong>
                      {currentPinLookup.area &&
                      currentPinLookup.city &&
                      currentPinLookup.area.toLowerCase() !==
                        currentPinLookup.city.toLowerCase()
                        ? `${currentPinLookup.area}, ${currentPinLookup.city}`
                        : currentPinLookup.city || currentPinLookup.district}
                      {currentPinLookup.state
                        ? `, ${currentPinLookup.state}`
                        : ""}
                    </strong>
                    <small>Location found for this PIN code</small>
                  </span>
                </div>
              )}

              {currentPinLookup.status === "invalid" && (
                <p className="nexora-location-error">
                  PIN code not found. Please check the 6 digits.
                </p>
              )}

              {currentPinLookup.status === "unavailable" && (
                <p className="nexora-pin-status">
                  Postal details are unavailable right now. You can still use
                  this valid PIN code.
                </p>
              )}

              {locationError && (
                <p className="nexora-location-error">{locationError}</p>
              )}

              <button type="submit" className="nexora-apply-location">
                Apply
              </button>
              <p className="nexora-location-note">
                Your selection is saved in this browser for your next visit.
              </p>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .nexora-header{position:sticky;top:0;z-index:1000;width:100%}
        .nexora-main-header{display:grid;grid-template-columns:auto minmax(150px,auto) minmax(180px,1fr) auto;align-items:center;gap:clamp(10px,1.5vw,22px);padding:12px clamp(14px,2.2vw,28px);box-sizing:border-box;background:#111827;color:#fff}
        .nexora-logo{justify-self:start;flex-shrink:0;color:#fff;text-decoration:none;font-size:clamp(24px,2.5vw,32px);font-weight:800;letter-spacing:-1px;white-space:nowrap}
        .nexora-logo span{color:#5eead4}
        .nexora-delivery{display:flex;align-items:center;gap:6px;flex-shrink:0;padding:6px;border:1px solid transparent;border-radius:6px;background:transparent;color:#fff;text-align:left;cursor:pointer}
        .nexora-delivery:hover{border-color:#5eead4;background:#1f2937}
        .nexora-delivery>svg:first-child,.nexora-icon-link svg{color:#5eead4;flex-shrink:0}
        .nexora-delivery-copy small,.nexora-delivery-copy strong{display:block}
        .nexora-delivery-copy small{color:#d1d5db;font-size:11px}
        .nexora-delivery-copy strong{font-size:13px}
        .nexora-delivery-chevron{opacity:.65}
        .nexora-search{position:relative;display:flex;flex:1;min-width:100px;height:42px;overflow:visible;border:2px solid #0f766e;border-radius:6px;background:#fff;box-sizing:border-box}
        .nexora-search:focus-within{border-color:#5eead4;box-shadow:0 0 0 2px rgba(94,234,212,.2)}
        .nexora-search input[type="text"]{flex:1;width:100%;min-width:0;padding:0 14px;border:0;outline:0;border-radius:5px;background:#fff;color:#111827;font-size:14px}
        .nexora-search>button[type="submit"]{display:flex;align-items:center;justify-content:center;width:48px;min-width:48px;border:0;border-radius:0 3px 3px 0;background:#0f766e;color:#fff;cursor:pointer}
        .nexora-search>button[type="submit"]:hover{background:#115e59}
        .nexora-search .nexora-search-clear{display:flex;align-items:center;justify-content:center;width:32px;min-width:32px;border:0;background:#fff;color:#6b7280;cursor:pointer}
        .nexora-suggestions{position:absolute;top:calc(100% + 7px);left:-2px;right:-2px;z-index:1200;overflow:hidden;border:1px solid #e5e7eb;border-radius:9px;background:#fff;color:#111827;box-shadow:0 14px 35px rgba(0,0,0,.18)}
        .nexora-suggestions-heading{padding:12px 14px 8px;color:#6b7280;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .nexora-suggestion{display:flex;width:100%;align-items:center;gap:11px;padding:11px 14px;border:0;background:#fff;color:#111827;text-align:left;cursor:pointer}
        .nexora-suggestion:hover,.nexora-suggestion:focus{background:#f0fdfa;outline:0}
        .nexora-suggestion-icon{display:grid;place-items:center;width:32px;height:32px;flex-shrink:0;border-radius:7px;background:#f3f4f6;color:#0f766e}
        .nexora-suggestion-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
        .nexora-suggestion-copy strong{overflow:hidden;font-size:13px;font-weight:650;text-overflow:ellipsis;white-space:nowrap}
        .nexora-suggestion-copy small{color:#6b7280;font-size:11px}
        .nexora-suggestion>svg{color:#9ca3af}
        .nexora-view-all{width:100%;padding:12px 14px;border:0;border-top:1px solid #e5e7eb;background:#f9fafb;color:#0f766e;text-align:left;font-size:13px;font-weight:700;cursor:pointer}
        .nexora-view-all:hover{background:#f0fdfa}
        .nexora-no-suggestions{padding:16px;color:#6b7280;font-size:13px;line-height:1.5}
        .nexora-account-links{display:flex;align-items:center;gap:4px;flex-shrink:0}
        .nexora-icon-link{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px;border:1px solid transparent;border-radius:5px;color:#fff;text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap}
        .nexora-icon-link:hover{border-color:#5eead4;color:#5eead4}
        .nexora-category-nav{display:flex;align-items:center;justify-content:space-between;gap:3px;padding:7px clamp(10px,2vw,24px);overflow-x:auto;overflow-y:hidden;background:#fff;border-bottom:1px solid #e5e7eb;box-sizing:border-box;scrollbar-width:none;white-space:nowrap}
        .nexora-category-nav::-webkit-scrollbar{display:none}
        .nexora-nav-link{display:flex;min-width:64px;flex:0 0 auto;align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:5px 5px;border:1px solid transparent;border-radius:8px;background:transparent;color:#364152;text-decoration:none;font-size:10px;font-weight:650;white-space:nowrap;transition:color .2s,border-color .2s,background .2s;box-sizing:border-box}
        .nexora-category-icon{display:grid;width:27px;height:27px;place-items:center;border-radius:50%;background:#f1f5f5;color:#0f766e;transition:background .2s,color .2s}
        .nexora-category-label{white-space:nowrap}
        .nexora-nav-link:hover,.nexora-nav-link.active{border-color:#ccfbf1;background:#f0fdfa;color:#0f766e}
        .nexora-nav-link:hover .nexora-category-icon,.nexora-nav-link.active .nexora-category-icon{background:#ccfbf1;color:#0f766e}
        .nexora-nav-utility{min-width:auto;flex-direction:row;gap:5px;padding:8px 7px;color:#475569;font-size:11px}
        .nexora-nav-utility svg{color:#0f766e;flex:0 0 auto}
        .nexora-nav-spacer{flex:1 0 8px;min-width:8px}
        .nexora-logout{flex-shrink:0;padding:7px 10px;border:1px solid #99f6e4;border-radius:7px;background:#fff;color:#0f766e;cursor:pointer;font-size:11px;font-weight:700;white-space:nowrap}
        .nexora-logout:hover{background:#f0fdfa}
        .nexora-modal-backdrop{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.62);backdrop-filter:blur(3px)}
        .nexora-location-modal{width:min(100%,440px);max-height:calc(100vh - 40px);overflow-y:auto;padding:25px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;color:#111827;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box}
        .nexora-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:23px}
        .nexora-modal-eyebrow{display:flex;align-items:center;gap:6px;color:#0f766e;font-size:10px;font-weight:800;letter-spacing:.1em}
        .nexora-location-modal h2{margin:9px 0 6px;font-size:24px;letter-spacing:-.6px}
        .nexora-location-modal .nexora-modal-header p{margin:0;color:#6b7280;font-size:13px;line-height:1.5}
        .nexora-modal-close{display:grid;place-items:center;width:34px;height:34px;flex-shrink:0;border:0;border-radius:8px;background:#f3f4f6;color:#4b5563;cursor:pointer}
        .nexora-modal-close:hover{background:#e5e7eb}
        .nexora-field-label{display:block;margin:15px 0 7px;font-size:12px;font-weight:750;color:#374151}
        .nexora-location-modal select,.nexora-location-modal input{width:100%;height:44px;padding:0 12px;border:1px solid #d1d5db;border-radius:7px;outline:0;background:#fff;color:#111827;font:inherit;font-size:14px;box-sizing:border-box}
        .nexora-location-modal select:focus,.nexora-location-modal input:focus{border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12)}
        .nexora-apply-location{width:100%;height:44px;margin-top:20px;border:0;border-radius:7px;background:#0f766e;color:#fff;font-size:14px;font-weight:750;cursor:pointer}
        .nexora-apply-location:hover{background:#115e59}
        .nexora-location-note{margin:12px 0 0;color:#6b7280;font-size:11px;text-align:center}
        .nexora-location-error{margin:7px 0 0;color:#b91c1c;font-size:12px}
        .nexora-pin-status{margin:8px 0 0;color:#6b7280;font-size:12px;line-height:1.45}
        .nexora-pin-result{display:flex;align-items:flex-start;gap:9px;margin-top:10px;padding:11px;border:1px solid #99f6e4;border-radius:8px;background:#f0fdfa;color:#115e59}
        .nexora-pin-result>svg{margin-top:2px;flex-shrink:0}
        .nexora-pin-result span{display:flex;flex-direction:column;gap:3px}
        .nexora-pin-result strong{font-size:13px}
        .nexora-pin-result small{color:#0f766e;font-size:11px}
        .nexora-detect-location{display:flex;width:100%;min-height:43px;align-items:center;justify-content:center;gap:8px;margin:0 0 16px;padding:8px 12px;border:1px solid #99f6e4;border-radius:7px;background:#f0fdfa;color:#0f766e;font-size:13px;font-weight:750;cursor:pointer}
        .nexora-detect-location:hover{background:#ccfbf1}
        .nexora-detect-location:disabled{opacity:.65;cursor:wait}
        .nexora-saved-addresses{margin:0 0 18px}
        .nexora-saved-address-heading{display:block;margin-bottom:8px;color:#374151;font-size:12px;font-weight:750}
        .nexora-saved-address{display:flex;width:100%;align-items:center;gap:9px;margin-top:6px;padding:10px;border:1px solid #e5e7eb;border-radius:7px;background:#fff;color:#374151;text-align:left;cursor:pointer}
        .nexora-saved-address:hover{border-color:#5eead4;background:#f0fdfa}
        .nexora-saved-address>svg:first-child{flex:0 0 auto;color:#0f766e}
        .nexora-saved-address>svg:last-child{flex:0 0 auto;margin-left:auto;color:#9ca3af}
        .nexora-saved-address span{display:flex;min-width:0;flex-direction:column;gap:3px}
        .nexora-saved-address strong{overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
        .nexora-saved-address small{color:#6b7280;font-size:10px}
        @media(max-width:900px){
          .nexora-main-header{grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:10px 14px}
          .nexora-logo{grid-column:1;grid-row:1;font-size:26px}
          .nexora-delivery{grid-column:1 / -1;grid-row:2;justify-self:stretch;width:100%;min-width:0;min-height:38px;margin-top:2px;padding:6px 9px;border-radius:5px;background:#1f2937;box-sizing:border-box}
          .nexora-delivery-copy{display:block}
          .nexora-delivery-copy strong{max-width:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .nexora-delivery-chevron{display:none}
          .nexora-search{grid-column:1 / -1;grid-row:3;width:100%;min-width:0;height:42px}
          .nexora-account-links{grid-column:2;grid-row:1;justify-self:end;gap:3px}
          .nexora-icon-link{padding:7px}
          .nexora-icon-link span{display:none}
          .nexora-category-nav{justify-content:flex-start;gap:3px;padding:6px 10px}
        }
        @media(max-width:600px){
          .nexora-main-header{grid-template-columns:minmax(0,1fr) auto;gap:7px;padding:9px 10px}
          .nexora-logo{font-size:24px}
          .nexora-delivery-copy small{font-size:10px}
          .nexora-delivery-copy strong{max-width:150px;font-size:12px}
          .nexora-delivery>svg:first-child{width:19px;height:19px}
          .nexora-account-links{gap:1px}
          .nexora-icon-link{padding:6px}
          .nexora-icon-link svg{width:21px;height:21px}
          .nexora-search{grid-column:1 / -1;grid-row:3;height:40px}
          .nexora-search input[type="text"]{font-size:14px;padding-inline:11px}
          .nexora-search>button[type="submit"]{width:43px;min-width:43px}
          .nexora-category-nav{gap:3px;padding:5px 7px;overscroll-behavior-x:contain}
          .nexora-nav-link{min-width:64px;padding:5px 4px;font-size:9px}
          .nexora-category-icon{width:25px;height:25px}
          .nexora-nav-utility{min-width:auto;padding:7px 6px;font-size:10px}
          .nexora-nav-spacer{flex:0 0 5px;min-width:5px}
          .nexora-logout{flex:0 0 auto;padding:7px 10px;color:#0f766e;border-color:#99f6e4}
          .nexora-logout:hover{background:#f0fdfa}
        }
        @media(max-width:380px){
          .nexora-logo{font-size:22px}
          .nexora-main-header{padding:8px;gap:6px}
          .nexora-icon-link{padding:5px}
          .nexora-icon-link svg{width:19px;height:19px}
          .nexora-delivery-copy strong{max-width:118px;font-size:11px}
          .nexora-category-nav{padding-inline:6px}
          .nexora-nav-link{min-width:60px;padding-inline:3px;font-size:9px}
        }
      `}</style>
    </>
  );
}

export default Navbar;