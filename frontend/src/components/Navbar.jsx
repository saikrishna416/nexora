import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  UserRound, ShoppingCart, Heart, Search, MapPin, Menu, X, ChevronRight,
} from "lucide-react";

// Keep these category values aligned with your Products page.
const categories = [
  { label: "Electronics", value: "Electronics" },
  { label: "Men's Fashion", value: "Men's Fashion" },
  { label: "Women's Fashion", value: "Women's Fashion" },
  { label: "Kids", value: "Kids" },
  { label: "Home & Living", value: "Home & Living" },
  { label: "Beauty", value: "Beauty & Personal Care" },
  { label: "Sports", value: "Sports & Fitness" },
];

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [searchTerm, setSearchTerm] = useState(() => params.get("search") || "");
  const [products, setProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [country, setCountry] = useState(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("nexoraCountry") || "India" : "India"
  );
  const [pinCode, setPinCode] = useState(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("nexoraPinCode") || "" : ""
  );
  const [deliveryCity, setDeliveryCity] = useState(() =>
    typeof window !== "undefined" ? window.localStorage.getItem("nexoraDeliveryCity") || "" : ""
  );
  const [draftCountry, setDraftCountry] = useState(country);
  const [draftPinCode, setDraftPinCode] = useState(pinCode);
  const [locationError, setLocationError] = useState("");
  const [pinLookup, setPinLookup] = useState({ pin: "", status: "idle", district: "", state: "" });

  // Keep the input initialized from the URL on mount. Search submissions
  // and suggestion clicks update this state directly, avoiding effect-driven renders.

  // Fetch Indian postal details after the user finishes typing a valid PIN.
  // State updates happen in the asynchronous callback, not synchronously in the effect.
  useEffect(() => {
    const cleanPin = draftPinCode.trim();
    if (draftCountry !== "India" || !/^\d{6}$/.test(cleanPin)) return undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setPinLookup({ pin: cleanPin, status: "loading", district: "", state: "" });
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${cleanPin}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("PIN lookup request failed");
        const data = await response.json();
        const record = data?.[0];

        if (record?.Status === "Success" && Array.isArray(record.PostOffice) && record.PostOffice.length) {
          const office = record.PostOffice[0];
          setPinLookup({
            pin: cleanPin,
            status: "success",
            district: office.District || "",
            city: String(office.Name || office.Block || office.District || "")
              .replace(/\\s+(H\\.O\\.|S\\.O\\.|B\\.O\\.)$/i, "")
              .trim(),
            state: office.State || "",
          });
        } else {
          setPinLookup({ pin: cleanPin, status: "invalid", district: "", state: "" });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setPinLookup({ pin: cleanPin, status: "unavailable", district: "", state: "" });
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [draftCountry, draftPinCode]);

  const currentPinLookup =
    pinLookup.pin === draftPinCode.trim() && draftCountry === "India"
      ? pinLookup
      : { pin: draftPinCode.trim(), status: "idle", district: "", city: "", state: "" };

  // Load product data from common Django REST endpoint patterns.
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      const urls = [
        `${API_BASE_URL}/products/?page_size=100`,
        `${API_BASE_URL}/api/products/?page_size=100`,
        `${API_BASE_URL}/products/`,
        `${API_BASE_URL}/api/products/`,
      ];

      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) continue;
          const data = await response.json();
          const list = Array.isArray(data)
            ? data
            : (data.results || data.products || data.data || data.items || []);
          if (Array.isArray(list) && list.length) {
            setProducts(list);
            return;
          }
        } catch (error) {
          if (error.name === "AbortError") return;
          // Try the next common endpoint if this one is unavailable.
        }
      }
      if (!controller.signal.aborted) setProducts([]);
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((product) => {
        const name = String(
          product.name || product.title || product.product_name || product.productName || ""
        ).toLowerCase();
        const categoryValue =
          product.category_name || product.category?.name || product.category?.title || product.category || "";
        const category = String(categoryValue).toLowerCase();
        const description = String(product.description || "").toLowerCase();
        return name.includes(query) || category.includes(query) || description.includes(query);
      })
      .slice(0, 6);
  }, [products, searchTerm]);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
    setSearchTerm(product.name || product.title || product.product_name || product.productName || "");
    if (product.id != null) {
      navigate(`/products/${product.id}`);
    } else {
      const queryParams = new URLSearchParams();
      queryParams.set("search", product.name || product.title || product.product_name || product.productName || searchTerm);
      navigate(`/products?${queryParams.toString()}`);
    }
  };

  const applyLocation = (event) => {
    event.preventDefault();
    const cleanPin = draftPinCode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setLocationError("Enter a valid 6-digit PIN code.");
      return;
    }
    try {
      window.localStorage.setItem("nexoraCountry", draftCountry);
      window.localStorage.setItem("nexoraPinCode", cleanPin);
      if (draftCountry === "India" && currentPinLookup.status === "success") {
        window.localStorage.setItem("nexoraDeliveryCity", currentPinLookup.city || currentPinLookup.district || "");
      } else {
        window.localStorage.removeItem("nexoraDeliveryCity");
      }
    } catch (error) {
      console.error("Could not save delivery location:", error);
    }
    setCountry(draftCountry);
    setPinCode(cleanPin);
    const detectedCity =
      draftCountry === "India" && currentPinLookup.status === "success"
        ? (currentPinLookup.city || currentPinLookup.district || "")
        : "";
    setDeliveryCity(detectedCity);
    setLocationError("");
    setLocationOpen(false);
  };

  const categoryIsActive = (value) =>
    location.pathname === "/products" &&
    (params.get("category") || "").trim().toLowerCase() === value.trim().toLowerCase();

  const isProductsPage = location.pathname === "/products";
  const isHome = location.pathname === "/";
  const isAllProducts = isProductsPage && !params.get("category") && !params.get("search");
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
              setLocationOpen(true);
            }}
            aria-label="Choose delivery location"
          >
            <MapPin size={21} />
            <span className="nexora-delivery-copy">
              <small>Deliver to</small>
              <strong>
                {country === "India" && deliveryCity
                  ? `Deliver to ${deliveryCity} ${pinCode}`
                  : `Deliver to ${country}${pinCode ? ` ${pinCode}` : ""}`}
              </strong>
            </span>
            <ChevronRight className="nexora-delivery-chevron" size={14} />
          </button>

          <form className="nexora-search" onSubmit={handleSearch} role="search">
            <input
              type="search"
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
                    <div className="nexora-suggestions-heading">Suggested products</div>
                    {suggestions.map((product, index) => (
                      <button
                        type="button"
                        className="nexora-suggestion"
                        key={product.id ?? `${product.name || product.title}-${index}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectSuggestion(product)}
                      >
                        <span className="nexora-suggestion-icon"><Search size={15} /></span>
                        <span className="nexora-suggestion-copy">
                          <strong>{product.name || product.title || product.product_name || product.productName || "Product"}</strong>
                          {(product.category_name || product.category) && (
                            <small>{product.category_name || product.category}</small>
                          )}
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    <button type="submit" className="nexora-view-all" onMouseDown={(event) => event.preventDefault()}>
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
                  <UserRound size={21} /><span>Account</span>
                </Link>
                <Link to="/orders" className="nexora-icon-link">Orders</Link>
                <Link to="/wishlist" className="nexora-icon-link" aria-label="Wishlist" title="Wishlist">
                  <Heart size={21} /><span>Wishlist</span>
                </Link>
              </>
            ) : (
              <Link to="/login" className="nexora-icon-link">
                <UserRound size={21} /><span>Sign in</span>
              </Link>
            )}
            <Link to="/cart" className="nexora-icon-link" aria-label="Shopping cart" title="Shopping cart">
              <ShoppingCart size={25} /><span>Cart</span>
            </Link>
          </div>
        </div>

        <nav className="nexora-category-nav" aria-label="Product categories">
          <Link to="/products" className={navClass(isAllProducts)}>
            <Menu size={16} /> All Products
          </Link>
          <Link to="/" className={navClass(isHome)}>Home</Link>
          {categories.map((category) => (
            <Link
              key={category.value}
              to={`/products?category=${encodeURIComponent(category.value)}`}
              className={navClass(categoryIsActive(category.value))}
            >
              {category.label}
            </Link>
          ))}
          <div className="nexora-nav-spacer" />
          {isAuthenticated ? (
            <button type="button" onClick={handleLogout} className="nexora-logout">Logout</button>
          ) : (
            <Link to="/register" className={navClass(location.pathname === "/register")}>Create Account</Link>
          )}
        </nav>
      </header>

      {locationOpen && (
        <div
          className="nexora-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLocationOpen(false);
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
                <span className="nexora-modal-eyebrow"><MapPin size={15} /> DELIVERY PREFERENCES</span>
                <h2 id="nexora-location-title">Choose your location</h2>
                <p>Check product availability and delivery options near you.</p>
              </div>
              <button type="button" className="nexora-modal-close" onClick={() => setLocationOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={applyLocation}>
              <label className="nexora-field-label" htmlFor="nexora-country">Country or region</label>
              <select id="nexora-country" value={draftCountry} onChange={(event) => setDraftCountry(event.target.value)}>
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Singapore">Singapore</option>
              </select>

              <label className="nexora-field-label" htmlFor="nexora-pin">6-digit PIN code</label>
              <input
                id="nexora-pin"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                placeholder="e.g. 110001"
                value={draftPinCode}
                onChange={(event) => {
                  setDraftPinCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setLocationError("");
                }}
              />
              {currentPinLookup.status === "loading" && <p className="nexora-pin-status">Looking up PIN code…</p>}
              {currentPinLookup.status === "success" && (
                <div className="nexora-pin-result">
                  <MapPin size={16} />
                  <span>
                    <strong>{currentPinLookup.city || currentPinLookup.district}{currentPinLookup.state ? `, ${currentPinLookup.state}` : ""}</strong>
                    <small>Location found for this PIN code</small>
                  </span>
                </div>
              )}
              {currentPinLookup.status === "invalid" && <p className="nexora-location-error">PIN code not found. Please check the 6 digits.</p>}
              {currentPinLookup.status === "unavailable" && <p className="nexora-pin-status">Could not fetch location right now. Check your connection and try again.</p>}
              {locationError && <p className="nexora-location-error">{locationError}</p>}
              <button type="submit" className="nexora-apply-location">Apply location</button>
              <p className="nexora-location-note">Your selection is saved in this browser for your next visit.</p>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .nexora-header{position:sticky;top:0;z-index:1000;width:100%}
        .nexora-main-header{display:flex;align-items:center;gap:16px;padding:12px 24px;box-sizing:border-box;background:#111827;color:#fff}
        .nexora-logo{flex-shrink:0;color:#fff;text-decoration:none;font-size:28px;font-weight:800;letter-spacing:-1px}
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
        .nexora-search input[type="search"]{flex:1;width:100%;min-width:0;padding:0 14px;border:0;outline:0;border-radius:5px;background:#fff;color:#111827;font-size:14px}
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
        .nexora-category-nav{display:flex;align-items:center;gap:5px;padding:7px 20px;overflow-x:auto;background:#1f2937;border-bottom:2px solid #0f766e;box-sizing:border-box;scrollbar-width:thin}
        .nexora-nav-link{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;padding:8px 10px;border:1px solid transparent;border-radius:5px;background:transparent;color:#fff;text-decoration:none;font-size:13px;font-weight:600;white-space:nowrap;transition:color .2s,border-color .2s}
        .nexora-nav-link:hover,.nexora-nav-link.active{border-color:#5eead4;color:#5eead4}
        .nexora-nav-spacer{flex:1;min-width:4px}
        .nexora-logout{flex-shrink:0;padding:7px 12px;border:1px solid #0f766e;border-radius:5px;background:transparent;color:#5eead4;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap}
        .nexora-logout:hover{background:#374151}
        .nexora-modal-backdrop{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.62);backdrop-filter:blur(3px)}
        .nexora-location-modal{width:min(100%,440px);padding:25px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;color:#111827;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box}
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
        @media(max-width:900px){.nexora-main-header{gap:10px;padding:10px 14px}.nexora-delivery-copy{display:none}.nexora-delivery{gap:2px;padding:7px}.nexora-delivery-chevron{display:none}.nexora-icon-link span{display:none}.nexora-account-links{gap:2px}}
        @media(max-width:600px){.nexora-main-header{flex-wrap:wrap;gap:8px;padding:10px}.nexora-logo{font-size:24px}.nexora-account-links{margin-left:auto}.nexora-search{order:3;flex-basis:100%;height:40px}.nexora-category-nav{gap:2px;padding:6px 8px}.nexora-nav-link{padding:7px 8px;font-size:12px}.nexora-delivery-copy{display:block}.nexora-delivery-copy strong{max-width:95px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
      `}</style>
    </>
  );
}

export default Navbar;
