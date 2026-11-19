const STORAGE_KEY = "nexoraDeliveryLocation";
const LOCATION_UPDATED_EVENT = "nexora:location-updated";

function getLocationLabel(location) {
  const places = [location.area, location.city]
    .map((value) => String(value || "").trim())
    .filter(
      (value, index, values) =>
        value &&
        values.findIndex(
          (other) => other.toLowerCase() === value.toLowerCase()
        ) === index
    );
  const locality = places.join(", ") || "India";
  return `${locality}${location.pincode ? ` - ${location.pincode}` : ""}`;
}

function normalizeLocation(location = {}) {
  const normalized = {
    country: location.country || "India",
    area: String(location.area || ""),
    city: String(location.city || location.district || ""),
    state: String(location.state || ""),
    pincode: String(location.pincode || "").replace(/\D/g, "").slice(0, 6),
  };
  return {
    ...normalized,
    label:
      normalized.area || normalized.city
        ? getLocationLabel(normalized)
        : location.label || getLocationLabel(normalized),
  };
}

function fallbackLocation(pincode) {
  return {
    ...normalizeLocation({ pincode, label: `PIN ${pincode}` }),
    source: "fallback",
  };
}

export function getSavedDeliveryLocation() {
  if (typeof window === "undefined") return normalizeLocation();

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "null"
    );
    if (stored && typeof stored === "object") {
      return normalizeLocation(stored);
    }

    return normalizeLocation({
      city: window.localStorage.getItem("nexoraDeliveryCity") || "",
      pincode: window.localStorage.getItem("nexoraPinCode") || "",
      country: window.localStorage.getItem("nexoraCountry") || "India",
    });
  } catch (error) {
    console.warn("Could not read the saved delivery location:", error);
    return normalizeLocation();
  }
}

export function saveDeliveryLocation(location) {
  const normalized = normalizeLocation(location);
  if (typeof window === "undefined") return normalized;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.localStorage.setItem("nexoraCountry", normalized.country);
    window.localStorage.setItem("nexoraPinCode", normalized.pincode);
    if (normalized.area || normalized.city) {
      window.localStorage.setItem(
        "nexoraDeliveryCity",
        normalized.area || normalized.city
      );
    } else {
      window.localStorage.removeItem("nexoraDeliveryCity");
    }
  } catch (error) {
    throw new Error("Could not save your delivery location.", { cause: error });
  }

  window.dispatchEvent(new Event(LOCATION_UPDATED_EVENT));
  return normalized;
}

export async function lookupIndianPincode(pincode, options = {}) {
  const cleanPincode = String(pincode || "").trim();
  if (!/^[1-9]\d{5}$/.test(cleanPincode)) {
    throw new Error("Enter a valid 6-digit Indian PIN code.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  const abortRequest = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", abortRequest, { once: true });
    }
  }

  try {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(cleanPincode)}`,
      { signal: controller.signal }
    );
    if (!response.ok) throw new Error("India Post lookup failed.");

    const data = await response.json();
    const record = data?.[0];
    const office = record?.PostOffice?.[0];
    if (record?.Status !== "Success" || !office) {
      return fallbackLocation(cleanPincode);
    }

    return {
      ...normalizeLocation({
        area: String(office.Name || office.Block || "")
          .replace(/\s+(H\.O\.|S\.O\.|B\.O\.)$/i, "")
          .trim(),
        city: office.District || office.Block || "",
        state: office.State || "",
        pincode: cleanPincode,
      }),
      source: "india-post",
    };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return fallbackLocation(cleanPincode);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortRequest);
  }
}
