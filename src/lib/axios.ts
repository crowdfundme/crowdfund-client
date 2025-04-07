// src/utils/axios.ts
import axios, { InternalAxiosRequestConfig } from "axios";

// Cache for the API key
let cachedApiKey: string | null = null;

async function fetchApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  try {
    const response = await axios.get("/api/solana-rpc", {
      headers: { "X-Skip-Interceptor": "true" },
    });
    cachedApiKey = response.data.apiKey;
    if (!cachedApiKey) throw new Error("API key not returned from server");
    console.log("[axios] Fetched API key:", cachedApiKey);
    return cachedApiKey;
  } catch (error) {
    console.error("[axios] Failed to fetch API key:", error);
    return "valet_6bbdee7e04c5cb0ad0bcd76ca8a17314"; // Fallback
  }
}

// Prefetch the API key
fetchApiKey().catch((error) => console.error("[axios] Prefetch failed:", error));

// Global interceptor
axios.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (config.headers && config.headers["X-Skip-Interceptor"] === "true") {
      return config;
    }

    const apiKey = await fetchApiKey();
    config.headers = config.headers || {};
    config.headers["X-API-Key"] = apiKey;
    config.headers["X-From-Vercel"] = "true";

    if (!(config.data instanceof FormData) && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    console.log("[axios] Interceptor applied - URL:", config.url, "Headers:", config.headers);
    return config;
  },
  (error) => Promise.reject(error)
);