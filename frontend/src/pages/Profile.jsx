import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Heart,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import {
  getSavedDeliveryLocation,
  lookupIndianPincode,
  saveDeliveryLocation,
} from "../utils/deliveryLocation";
import "./Profile.css";

const EMPTY_PROFILE = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
};

const EMPTY_ADDRESS = {
  full_name: "",
  phone_number: "",
  address_line: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

function normalizeIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const nationalNumber = digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
  if (!/^[6-9]\d{9}$/.test(nationalNumber)) return "";
  return `+91${nationalNumber}`;
}

function getErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "object" && data) {
    const firstError = Object.values(data).flat().find(Boolean);
    if (typeof firstError === "string") return firstError;
  }
  return fallback;
}

function getInitials(name, username) {
  const parts = String(name || username || "N")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function getShippingText(address) {
  if (typeof address === "string") return address;
  if (!address || typeof address !== "object") return "";
  return [
    address.full_name || address.name,
    address.address_line || address.address,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
}

function Profile() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [recentOrderAddress, setRecentOrderAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(
    getSavedDeliveryLocation
  );
  const [loading, setLoading] = useState(Boolean(isAuthenticated));
  const [loadError, setLoadError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("profile");
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);
  const [busyAddressId, setBusyAddressId] = useState(null);
  const [pinLookupLoading, setPinLookupLoading] = useState(false);
  const [lookedUpPin, setLookedUpPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    const loadAccountData = async () => {
      const results = await Promise.allSettled([
        api.get("/accounts/profile/"),
        api.get("/accounts/addresses/"),
        api.get("/orders/"),
        api.get("/wishlist/"),
      ]);
      if (!active) return;

      const [profileResult, addressResult, orderResult, wishlistResult] = results;
      if (profileResult.status === "fulfilled") {
        const nextProfile = profileResult.value.data;
        setProfile(nextProfile);
        setProfileForm({
          first_name: nextProfile.first_name || "",
          last_name: nextProfile.last_name || "",
          email: nextProfile.email || "",
          phone_number: nextProfile.phone_number || "",
        });
      } else {
        console.error(
          "Profile loading failed:",
          profileResult.reason.response?.data || profileResult.reason
        );
        setLoadError(
          "Could not load your profile. Please log in again if your session has expired."
        );
      }

      if (addressResult.status === "fulfilled") {
        setAddresses(listFromResponse(addressResult.value.data));
      } else {
        console.error(
          "Saved address loading failed:",
          addressResult.reason.response?.data || addressResult.reason
        );
        setToast({
          type: "error",
          message: "Saved addresses could not be loaded. Please try again.",
        });
      }

      if (orderResult.status === "fulfilled") {
        const orderList = listFromResponse(orderResult.value.data);
        setOrders(orderList);
        setRecentOrderAddress(
          getShippingText(orderList.find((order) => order.shipping_address)?.shipping_address)
        );
      } else {
        console.warn(
          "Order count unavailable:",
          orderResult.reason.response?.data || orderResult.reason
        );
      }

      if (wishlistResult.status === "fulfilled") {
        setWishlistCount(listFromResponse(wishlistResult.value.data).length);
      } else {
        console.warn(
          "Wishlist count unavailable:",
          wishlistResult.reason.response?.data || wishlistResult.reason
        );
      }

      setLoading(false);
    };

    loadAccountData();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const updateLocation = () => setDeliveryLocation(getSavedDeliveryLocation());
    window.addEventListener("nexora:location-updated", updateLocation);
    window.addEventListener("storage", updateLocation);
    return () => {
      window.removeEventListener("nexora:location-updated", updateLocation);
      window.removeEventListener("storage", updateLocation);
    };
  }, []);

  const fullName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      profile.username
    : "";
  const activePincode = deliveryLocation.pincode || "Not set";
  const fallbackAddress =
    profile?.address ||
    recentOrderAddress ||
    [
      deliveryLocation.area,
      deliveryLocation.city,
      deliveryLocation.state,
      deliveryLocation.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  const showToast = (type, message) => setToast({ type, message });

  const handleProfileChange = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setToast(null);
    const normalizedPhone = profileForm.phone_number.trim()
      ? normalizeIndianPhone(profileForm.phone_number)
      : "";
    if (profileForm.phone_number.trim() && !normalizedPhone) {
      showToast("error", "Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await api.patch("/accounts/profile/", {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
        phone_number: normalizedPhone,
      });
      setProfile(response.data);
      setProfileForm({
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        email: response.data.email || "",
        phone_number: response.data.phone_number || "",
      });
      setEditingProfile(false);
      showToast("success", "Your profile details were saved.");
    } catch (error) {
      console.error("Profile update failed:", error.response?.data || error);
      showToast(
        "error",
        getErrorMessage(error, "Could not save your profile. Please try again.")
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const syncDeliveryLocation = (address) => {
    const addressLines = String(address.address_line || "").split(/\r?\n/);
    const location = saveDeliveryLocation({
      area: address.locality || addressLines[1] || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      label: `${address.locality || address.city}, ${address.city} ${address.pincode}`,
    });
    setDeliveryLocation(location);
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...EMPTY_ADDRESS,
      full_name: fullName || profile?.username || "",
      phone_number: profile?.phone_number || "",
      city: deliveryLocation.city || "",
      state: deliveryLocation.state || "",
      pincode: deliveryLocation.pincode || "",
      is_default: addresses.length === 0,
    });
    setPinMessage("");
    setAddressFormOpen(true);
  };

  const editAddress = (address) => {
    const [addressLine = "", ...localityParts] = String(
      address.address_line || ""
    ).split(/\r?\n/);
    setEditingAddressId(address.id);
    setAddressForm({
      full_name: address.full_name || "",
      phone_number: address.phone_number || "",
      address_line: addressLine,
      locality: localityParts.join(" "),
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      is_default: Boolean(address.is_default),
    });
    setPinMessage("");
    setAddressFormOpen(true);
  };

  const lookupAddressPin = async (value = addressForm.pincode) => {
    const pincode = String(value || "").trim();
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setPinMessage("Enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (lookedUpPin === pincode) return;

    setLookedUpPin(pincode);
    setPinLookupLoading(true);
    setPinMessage("");
    try {
      const location = await lookupIndianPincode(pincode);
      setAddressForm((current) => ({
        ...current,
        pincode,
        locality: current.locality || location.area || "",
        city: location.city || current.city,
        state: location.state || current.state,
      }));
      setPinMessage(
        location.source === "fallback"
          ? "PIN is valid, but locality details are unavailable. Enter city and state manually."
          : `Found ${[location.area, location.city].filter(Boolean).join(", ")}.`
      );
    } catch (error) {
      console.error("Address PIN lookup failed:", error);
      setPinMessage(error.message || "Could not look up this PIN code.");
    } finally {
      setPinLookupLoading(false);
    }
  };

  const refreshAddresses = async () => {
    const response = await api.get("/accounts/addresses/");
    const list = listFromResponse(response.data);
    setAddresses(list);
    return list;
  };

  const setAddressAsDefault = async (address) => {
    setBusyAddressId(address.id);
    setToast(null);
    try {
      await api.patch(`/accounts/addresses/${address.id}/`, {
        is_default: true,
      });
      await Promise.all(
        addresses
          .filter(
            (item) =>
              String(item.id) !== String(address.id) && item.is_default
          )
          .map((item) =>
            api.patch(`/accounts/addresses/${item.id}/`, {
              is_default: false,
            })
          )
      );
      await refreshAddresses();
      try {
        syncDeliveryLocation(address);
        showToast("success", "Default delivery address updated.");
      } catch (error) {
        console.error("Could not sync delivery location:", error);
        showToast(
          "error",
          "Default address saved, but the Navbar delivery location could not be updated."
        );
      }
    } catch (error) {
      console.error("Default address update failed:", error.response?.data || error);
      showToast(
        "error",
        getErrorMessage(error, "Could not update the default address.")
      );
      try {
        await refreshAddresses();
      } catch (refreshError) {
        console.error("Address refresh failed:", refreshError);
      }
    } finally {
      setBusyAddressId(null);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setToast(null);
    const normalizedPhone = normalizeIndianPhone(addressForm.phone_number);
    if (!normalizedPhone) {
      showToast("error", "Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!/^[1-9]\d{5}$/.test(addressForm.pincode.trim())) {
      showToast("error", "Enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (
      !addressForm.full_name.trim() ||
      !addressForm.address_line.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim()
    ) {
      showToast("error", "Complete the recipient, street, city, and state fields.");
      return;
    }

    const addressLine = [
      addressForm.address_line.trim(),
      addressForm.locality.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    const payload = {
      full_name: addressForm.full_name.trim(),
      phone_number: normalizedPhone,
      address_line: addressLine,
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
      is_default: Boolean(addressForm.is_default),
    };

    setSavingAddress(true);
    try {
      const response = editingAddressId
        ? await api.patch(`/accounts/addresses/${editingAddressId}/`, payload)
        : await api.post("/accounts/addresses/", payload);
      const savedAddress = response.data;

      if (payload.is_default) {
        await Promise.all(
          addresses
            .filter((item) => String(item.id) !== String(savedAddress.id) && item.is_default)
            .map((item) =>
              api.patch(`/accounts/addresses/${item.id}/`, {
                is_default: false,
              })
            )
        );
      }

      await refreshAddresses();
      setAddressFormOpen(false);
      setEditingAddressId(null);
      setAddressForm(EMPTY_ADDRESS);
      if (payload.is_default) {
        try {
          syncDeliveryLocation({
            ...savedAddress,
            locality: addressForm.locality,
          });
          showToast("success", "Address saved and delivery location updated.");
        } catch (error) {
          console.error("Could not sync saved delivery address:", error);
          showToast(
            "error",
            "Address saved, but the Navbar delivery location could not be updated."
          );
        }
      } else {
        showToast("success", "Delivery address saved.");
      }
    } catch (error) {
      console.error("Address save failed:", error.response?.data || error);
      showToast(
        "error",
        getErrorMessage(error, "Could not save this address. Please try again.")
      );
      try {
        await refreshAddresses();
      } catch (refreshError) {
        console.error("Address refresh failed:", refreshError);
      }
    } finally {
      setSavingAddress(false);
    }
  };

  const closeAddressForm = () => {
    setAddressFormOpen(false);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS);
    setPinMessage("");
  };

  const selectMobileTab = (tab) => {
    setActiveMobileTab(tab);
    setToast(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) {
    return (
      <main className="account-page">
        <section className="account-guest-card">
          <span className="account-guest-icon">
            <UserRound size={32} aria-hidden="true" />
          </span>
          <p className="account-eyebrow">YOUR NEXORA ACCOUNT</p>
          <h1>Welcome to Nexora</h1>
          <p>Sign in to manage your details, delivery addresses, and shopping activity.</p>
          <div className="account-guest-actions">
            <Link to="/login" className="account-button account-button--primary">
              Sign in <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/register" className="account-button account-button--secondary">
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="account-page account-page--state" aria-live="polite">
        <LoaderCircle className="account-spinner" size={27} aria-hidden="true" />
        <p>Loading your account…</p>
      </main>
    );
  }

  if (loadError && !profile) {
    return (
      <main className="account-page account-page--state" role="alert">
        <p>{loadError}</p>
        <button
          type="button"
          className="account-button account-button--primary"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    );
  }

  const verifiedEmail = Boolean(
    profile?.email_verified || profile?.is_email_verified
  );
  const isAdmin = Boolean(profile?.is_staff || profile?.is_superuser);

  return (
    <main className="account-page">
      <div className="account-container">
        <header className="account-page-heading">
          <div>
            <p className="account-eyebrow">ACCOUNT CENTER</p>
            <h1>My Account</h1>
            <p>Manage your personal information, addresses, and shopping activity.</p>
          </div>
        </header>

        {toast && (
          <div
            className={`account-toast account-toast--${toast.type}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} aria-hidden="true" />
            ) : (
              <ShieldCheck size={18} aria-hidden="true" />
            )}
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss message">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="account-layout">
          <aside className="account-sidebar">
            <section className="account-greeting-card">
              <span className="account-avatar" aria-hidden="true">
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="" />
                ) : (
                  getInitials(fullName, profile?.username)
                )}
              </span>
              <div className="account-greeting-copy">
                <span>Hello,</span>
                <div className="account-greeting-name">
                  <strong>{fullName || profile?.username || "Nexora member"}</strong>
                  {isAdmin && <span className="account-admin-badge">Admin</span>}
                </div>
                <span className="account-email-badge">
                  <BadgeCheck size={14} aria-hidden="true" />
                  {verifiedEmail ? "Verified email" : "Email on account"}
                </span>
              </div>
            </section>

            <nav className="account-desktop-nav" aria-label="Account navigation">
              <Link to="/orders" className="account-nav-item">
                <Package size={19} aria-hidden="true" />
                <span>My Orders</span>
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="account-nav-item"
                onClick={() => document.getElementById("profile-information")?.scrollIntoView({ behavior: "smooth" })}
              >
                <UserRound size={19} aria-hidden="true" />
                <span>Profile Information</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="account-nav-item"
                onClick={() => document.getElementById("saved-addresses")?.scrollIntoView({ behavior: "smooth" })}
              >
                <MapPin size={19} aria-hidden="true" />
                <span>Manage Addresses</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
              <Link to="/wishlist" className="account-nav-item">
                <Heart size={19} aria-hidden="true" />
                <span>My Wishlist</span>
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
              <Link to="/orders" className="account-nav-item">
                <CreditCard size={19} aria-hidden="true" />
                <span>Payments &amp; Refunds</span>
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="account-nav-item account-nav-item--logout"
                onClick={handleLogout}
              >
                <LogOut size={19} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </nav>

            <nav className="account-mobile-tabs" aria-label="Account sections">
              {[
                ["profile", "Profile Info"],
                ["addresses", "Addresses"],
                ["quicklinks", "Quick Links"],
              ].map(([tab, label]) => (
                <button
                  type="button"
                  key={tab}
                  className={activeMobileTab === tab ? "is-active" : ""}
                  aria-pressed={activeMobileTab === tab}
                  onClick={() => selectMobileTab(tab)}
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="account-main">
            <section
              id="profile-information"
              className={`account-card account-section${activeMobileTab !== "profile" ? " account-mobile-hidden" : ""}`}
            >
              <div className="account-section-heading">
                <div>
                  <h2>Personal Information</h2>
                  <p>Your account details and contact preferences</p>
                </div>
                {!editingProfile && (
                  <button
                    type="button"
                    className="account-button account-button--outline"
                    onClick={() => {
                      setToast(null);
                      setEditingProfile(true);
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Edit
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="account-admin-panel">
                  <div>
                    <strong>Administrator access</strong>
                    <span>Manage store operations, orders, stock, and support tickets.</span>
                  </div>
                  <Link to="/admin-dashboard" className="account-button account-button--primary">
                    Open Admin Dashboard <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              )}

              {editingProfile ? (
                <form className="account-form-grid" onSubmit={saveProfile}>
                  <label>
                    First Name
                    <input
                      name="first_name"
                      autoComplete="given-name"
                      value={profileForm.first_name}
                      onChange={handleProfileChange}
                    />
                  </label>
                  <label>
                    Last Name
                    <input
                      name="last_name"
                      autoComplete="family-name"
                      value={profileForm.last_name}
                      onChange={handleProfileChange}
                    />
                  </label>
                  <label>
                    Email Address
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </label>
                  <label>
                    Mobile Number (+91)
                    <input
                      type="tel"
                      name="phone_number"
                      autoComplete="tel"
                      inputMode="tel"
                      maxLength={15}
                      value={profileForm.phone_number}
                      onChange={handleProfileChange}
                      placeholder="+91 98765 43210"
                    />
                  </label>
                  <div className="account-form-actions">
                    <button
                      type="submit"
                      className="account-button account-button--primary"
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <LoaderCircle className="account-spinner" size={17} aria-hidden="true" />
                      ) : (
                        <Save size={17} aria-hidden="true" />
                      )}
                      {savingProfile ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="account-button account-button--secondary"
                      disabled={savingProfile}
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({
                          first_name: profile?.first_name || "",
                          last_name: profile?.last_name || "",
                          email: profile?.email || "",
                          phone_number: profile?.phone_number || "",
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="account-info-grid">
                  <InfoItem icon={<UserRound size={18} />} label="Full Name" value={fullName || "Add your name"} />
                  <InfoItem icon={<Mail size={18} />} label="Email Address" value={profile?.email || "Add your email address"} />
                  <InfoItem icon={<MapPin size={18} />} label="Username" value={profile?.username || "—"} />
                  <InfoItem
                    icon={<ShoppingCart size={18} />}
                    label="Mobile Number"
                    value={profile?.phone_number || "Add your mobile number"}
                  />
                </div>
              )}
            </section>

            <section
              id="saved-addresses"
              className={`account-card account-section${activeMobileTab !== "addresses" ? " account-mobile-hidden" : ""}`}
            >
              <div className="account-section-heading">
                <div>
                  <h2>Manage Saved Addresses</h2>
                  <p>Choose where your Nexora orders should be delivered</p>
                </div>
                {!addressFormOpen && (
                  <button
                    type="button"
                    className="account-button account-button--outline"
                    onClick={openNewAddressForm}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add Address
                  </button>
                )}
              </div>

              {addresses.length > 0 ? (
                <div className="account-address-list">
                  {addresses.map((address) => (
                    <article className="account-address-card" key={address.id}>
                      <div className="account-address-heading">
                        <div>
                          <strong>{address.full_name}</strong>
                          {address.is_default && <span className="account-default-badge">DEFAULT</span>}
                        </div>
                        <span className="account-address-phone">{address.phone_number}</span>
                      </div>
                      <p>
                        {[address.address_line, address.city, address.state, address.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <div className="account-address-actions">
                        <button type="button" onClick={() => editAddress(address)}>
                          <Pencil size={14} aria-hidden="true" /> Edit
                        </button>
                        {!address.is_default && (
                          <button
                            type="button"
                            disabled={busyAddressId === address.id}
                            onClick={() => setAddressAsDefault(address)}
                          >
                            {busyAddressId === address.id ? (
                              <LoaderCircle className="account-spinner" size={14} aria-hidden="true" />
                            ) : (
                              <CheckCircle2 size={14} aria-hidden="true" />
                            )}
                            Set as Default
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-address-empty">
                  <MapPin size={20} aria-hidden="true" />
                  <div>
                    <strong>{fallbackAddress ? "Current delivery details" : "No saved addresses yet"}</strong>
                    <p>{fallbackAddress || "Add an address to make checkout faster."}</p>
                    {deliveryLocation.pincode && (
                      <span>Active delivery PIN: {deliveryLocation.pincode}</span>
                    )}
                  </div>
                </div>
              )}

              {addressFormOpen && (
                <form className="account-address-form" onSubmit={saveAddress}>
                  <div className="account-section-heading account-form-heading">
                    <div>
                      <h3>{editingAddressId ? "Update Delivery Address" : "Add Delivery Address"}</h3>
                      <p>Enter the recipient and delivery location details.</p>
                    </div>
                    <button
                      type="button"
                      className="account-icon-button"
                      aria-label="Close address form"
                      onClick={closeAddressForm}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="account-form-grid">
                    <label>
                      Full Name
                      <input
                        value={addressForm.full_name}
                        autoComplete="name"
                        onChange={(event) =>
                          setAddressForm((current) => ({ ...current, full_name: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Mobile Number
                      <input
                        value={addressForm.phone_number}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        placeholder="+91 98765 43210"
                        onChange={(event) =>
                          setAddressForm((current) => ({ ...current, phone_number: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label className="account-form-field-full">
                      House / Flat / Street Address
                      <input
                        value={addressForm.address_line}
                        autoComplete="address-line1"
                        onChange={(event) =>
                          setAddressForm((current) => ({ ...current, address_line: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label className="account-form-field-full">
                      Locality / Landmark
                      <input
                        value={addressForm.locality}
                        autoComplete="address-line2"
                        onChange={(event) =>
                          setAddressForm((current) => ({ ...current, locality: event.target.value }))
                        }
                        placeholder="Apartment, area, or nearby landmark"
                      />
                    </label>
                    <label>
                      6-digit PIN Code
                      <div className="account-pincode-control">
                        <input
                          value={addressForm.pincode}
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="postal-code"
                          onBlur={() => {
                            if (/^[1-9]\d{5}$/.test(addressForm.pincode.trim())) {
                              void lookupAddressPin();
                            }
                          }}
                          onChange={(event) => {
                            const pincode = event.target.value.replace(/\D/g, "").slice(0, 6);
                            setAddressForm((current) => ({ ...current, pincode }));
                            setLookedUpPin("");
                            setPinMessage("");
                          }}
                          required
                        />
                        <button
                          type="button"
                          disabled={pinLookupLoading}
                          onClick={() => void lookupAddressPin()}
                        >
                          {pinLookupLoading ? "Checking…" : "Check"}
                        </button>
                      </div>
                      {pinMessage && <small className="account-pin-message">{pinMessage}</small>}
                    </label>
                    <label>
                      City
                      <input
                        value={addressForm.city}
                        autoComplete="address-level2"
                        onChange={(event) =>
                          setAddressForm((current) => ({ ...current, city: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      State
                      <input
                        value={addressForm.state}
                        autoComplete="address-level1"
                        onChange={(event) =>
                          setAddressForm((current) => ({ ...current, state: event.target.value }))
                        }
                        required
                      />
                    </label>
                  </div>
                  <label className="account-default-checkbox">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, is_default: event.target.checked }))
                      }
                    />
                    Set as my default delivery address
                  </label>
                  <div className="account-form-actions">
                    <button
                      type="submit"
                      className="account-button account-button--primary"
                      disabled={savingAddress}
                    >
                      {savingAddress ? (
                        <LoaderCircle className="account-spinner" size={17} aria-hidden="true" />
                      ) : (
                        <Save size={17} aria-hidden="true" />
                      )}
                      {savingAddress ? "Saving…" : "Save Address"}
                    </button>
                    <button
                      type="button"
                      className="account-button account-button--secondary"
                      disabled={savingAddress}
                      onClick={closeAddressForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section
              className={`account-activity-section account-section${activeMobileTab !== "quicklinks" ? " account-mobile-hidden" : ""}`}
            >
              <h2 className="account-activity-title">Account Activity</h2>
              <div className="account-stats-grid">
                <Link to="/orders" className="account-stat-card">
                  <span className="account-stat-icon"><Package size={20} aria-hidden="true" /></span>
                  <span className="account-stat-copy"><small>Total Orders</small><strong>{orders.length}</strong></span>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>
                <Link to="/wishlist" className="account-stat-card">
                  <span className="account-stat-icon"><Heart size={20} aria-hidden="true" /></span>
                  <span className="account-stat-copy"><small>Wishlist Items</small><strong>{wishlistCount}</strong></span>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>
                <div className="account-stat-card account-stat-card--pin">
                  <span className="account-stat-icon"><MapPin size={20} aria-hidden="true" /></span>
                  <span className="account-stat-copy"><small>Delivery PIN</small><strong>{activePincode}</strong></span>
                </div>
              </div>

              <h2 className="account-activity-title account-quick-title">Quick Actions</h2>
              <div className="account-quick-grid">
                <Link to="/orders"><Package size={20} aria-hidden="true" /><strong>Orders</strong><span>Track purchases</span></Link>
                <Link to="/wishlist"><Heart size={20} aria-hidden="true" /><strong>Wishlist</strong><span>Saved products</span></Link>
                <Link to="/cart"><ShoppingCart size={20} aria-hidden="true" /><strong>Cart</strong><span>Review your cart</span></Link>
                <Link to="/faq"><CircleHelp size={20} aria-hidden="true" /><strong>Help Center</strong><span>Get support</span></Link>
              </div>
            </section>

            <footer className="account-footer">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>Your Nexora account, your shopping experience.</span>
              <button type="button" onClick={handleLogout}>
                <LogOut size={15} aria-hidden="true" /> Logout
              </button>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="account-info-item">
      <span className="account-info-icon">{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

export default Profile;
