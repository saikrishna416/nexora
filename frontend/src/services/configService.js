import { useState, useEffect } from "react";
import api from "./api";

let cachedConfig = null;
let fetchPromise = null;

export const DEFAULT_BUSINESS_CONFIG = {
  return_window_days: null,
  refund_business_days: null,
  free_shipping_enabled: false,
  free_shipping_threshold: null,
  standard_shipping_fee: null,
  order_processing_time: "",
  delivery_estimate_time: "",
  support_email: "",
  support_phone: "",
  business_address: "",
  privacy_policy_status: "DRAFT",
  terms_conditions_status: "DRAFT",
  return_refund_status: "DRAFT",
  shipping_policy_status: "DRAFT",
  payment_policy_status: "DRAFT",
  privacy_policy_approved: false,
  terms_conditions_approved: false,
  return_refund_approved: false,
  shipping_policy_approved: false,
  payment_policy_approved: false,
  effective_date: null,
  updated_at: null,
};

export async function fetchBusinessConfig(forceRefresh = false) {
  if (cachedConfig && !forceRefresh) {
    return cachedConfig;
  }

  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  fetchPromise = api
    .get("/core/configuration/")
    .then((response) => {
      cachedConfig = { ...DEFAULT_BUSINESS_CONFIG, ...response.data };
      return cachedConfig;
    })
    .catch((error) => {
      console.warn("Could not load business configuration, using defaults:", error?.message);
      return cachedConfig || DEFAULT_BUSINESS_CONFIG;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

export function useBusinessConfig() {
  const [config, setConfig] = useState(cachedConfig || DEFAULT_BUSINESS_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    fetchBusinessConfig()
      .then((data) => {
        if (mounted) {
          setConfig(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading, error };
}
