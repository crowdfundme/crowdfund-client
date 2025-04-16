// src/utils/axios.ts
import axios, { InternalAxiosRequestConfig } from "axios";

// Configure Axios default base URL for the Next.js API routes
const isBrowser = typeof window !== "undefined";
axios.defaults.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Cache for the API key from Next.js API
let cachedApiKey: string | null = null;

export async function fetchApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  // Skip fetching during build (non-browser environment)
  if (!isBrowser) {
    console.log("[axios] Skipping API key fetch during build, using fallback");
    return "valet_6bbdee7e04c5cb0ad0bcd76ca8a17314"; // Fallback during build
  }

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
    return "valet_6bbdee7e04c5cb0ad0bcd76ca8a17314"; // Fallback on error
  }
}

// Prefetch the API key only in runtime (browser)
if (isBrowser) {
  fetchApiKey().catch((error) => console.error("[axios] Prefetch failed:", error));
}

// Global Axios interceptor
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