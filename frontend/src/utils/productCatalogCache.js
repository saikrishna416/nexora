const STORAGE_KEY = "nexora_products_catalog_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

let memoryCache = null;
let inFlightRequest = null;
let cacheGeneration = 0;

function readSessionCache() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const age = Date.now() - parsed.timestamp;
    if (
      !Array.isArray(parsed.products) ||
      !Number.isFinite(parsed.timestamp) ||
      age < 0 ||
      age >= CACHE_TTL_MS
    ) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(cache) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // The in-memory cache remains available when browser storage is blocked.
  }
}

function extractProducts(response) {
  const payload = response?.data ?? response;
  const products = Array.isArray(payload)
    ? payload
    : payload?.results ?? payload?.products ?? payload?.data ?? payload?.items;

  if (!Array.isArray(products)) {
    throw new Error("The product catalog returned an unexpected response.");
  }

  return products;
}

export function getCachedProducts(apiClient, { forceRefresh = false } = {}) {
  if (!forceRefresh && memoryCache) {
    const age = Date.now() - memoryCache.timestamp;
    if (age >= 0 && age < CACHE_TTL_MS) {
      return Promise.resolve(memoryCache.products);
    }
    memoryCache = null;
  }

  if (!forceRefresh) {
    const storedCache = readSessionCache();
    if (storedCache) {
      memoryCache = storedCache;
      return Promise.resolve(storedCache.products);
    }
  }

  if (inFlightRequest) return inFlightRequest;

  const generation = cacheGeneration;
  const request = Promise.resolve()
    .then(() => apiClient.get("/products/?page_size=100"))
    .then((response) => {
      const cache = { products: extractProducts(response), timestamp: Date.now() };
      if (generation === cacheGeneration) {
        memoryCache = cache;
        writeSessionCache(cache);
      }
      return cache.products;
    })
    .finally(() => {
      if (inFlightRequest === request) inFlightRequest = null;
    });

  inFlightRequest = request;
  return request;
}

export function invalidateProductsCache() {
  cacheGeneration += 1;
  memoryCache = null;
  inFlightRequest = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Cache invalidation still applies to memory when browser storage is blocked.
  }
}
