const STORAGE_KEY = "nexora_products_catalog_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 800;

let memoryCache = null;
let inFlightRequest = null;
let cacheGeneration = 0;

function readStorageCache(storage) {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    const age = Date.now() - parsed.timestamp;
    if (
      !Array.isArray(parsed.products) ||
      !Number.isFinite(parsed.timestamp) ||
      age < 0
    ) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStorageCache(storage, cache) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Memory caching remains available when browser storage is blocked.
  }
}

function getBrowserStorage(name) {
  try {
    return globalThis[name] || null;
  } catch {
    return null;
  }
}

function getStorageCaches() {
  const caches = [];
  for (const storage of [
    getBrowserStorage("sessionStorage"),
    getBrowserStorage("localStorage"),
  ]) {
    if (!storage) continue;
    const cache = readStorageCache(storage);
    if (cache) caches.push(cache);
  }
  return caches;
}

function isFresh(cache) {
  const age = Date.now() - cache.timestamp;
  return age >= 0 && age < CACHE_TTL_MS;
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

function shouldRetry(error) {
  const status = error?.response?.status;
  return !error?.response || (status >= 500 && status < 600);
}

function fetchProductsWithRetry(apiClient) {
  const endpoint = "/products/?page_size=100";
  return Promise.resolve()
    .then(() => apiClient.get(endpoint))
    .catch((error) => {
      if (!shouldRetry(error)) throw error;
      return new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        .then(() => apiClient.get(endpoint));
    });
}

function startRequest(apiClient) {
  if (inFlightRequest) return inFlightRequest;

  const generation = cacheGeneration;
  const request = fetchProductsWithRetry(apiClient)
    .then((response) => {
      const cache = { products: extractProducts(response), timestamp: Date.now() };
      if (generation === cacheGeneration) {
        memoryCache = cache;
        for (const storage of [
          getBrowserStorage("sessionStorage"),
          getBrowserStorage("localStorage"),
        ]) {
          if (storage) writeStorageCache(storage, cache);
        }
      }
      return cache.products;
    })
    .finally(() => {
      if (inFlightRequest === request) inFlightRequest = null;
    });

  inFlightRequest = request;
  return request;
}

export function getCachedProducts(apiClient, { forceRefresh = false } = {}) {
  if (!forceRefresh && memoryCache && isFresh(memoryCache)) {
    return Promise.resolve(memoryCache.products);
  }

  if (!forceRefresh) {
    const caches = [memoryCache, ...getStorageCaches()]
      .filter(Boolean)
      .sort((left, right) => right.timestamp - left.timestamp);
    const cached = caches[0];
    if (cached) {
      memoryCache = cached;
      if (isFresh(cached)) {
        return Promise.resolve(cached.products);
      }

      startRequest(apiClient).catch((error) => {
        console.warn("Failed to refresh cached product catalog:", error);
      });
      return Promise.resolve(cached.products);
    }
  }

  return startRequest(apiClient);
}

export function invalidateProductsCache() {
  cacheGeneration += 1;
  memoryCache = null;
  inFlightRequest = null;
  for (const storage of [
    getBrowserStorage("sessionStorage"),
    getBrowserStorage("localStorage"),
  ]) {
    try {
      storage?.removeItem(STORAGE_KEY);
    } catch {
      // Cache invalidation still applies to memory when browser storage is blocked.
    }
  }
}
