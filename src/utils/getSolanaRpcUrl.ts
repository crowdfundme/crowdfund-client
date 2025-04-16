// src/app/utils/getSolanaRpcUrl.ts
export async function getSolanaRpcUrl(): Promise<string> {
  // Determine base URL based on environment
  const isBrowser = typeof window !== "undefined";
  const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const url = `${baseURL}/api/solana-rpc`;

  // Skip fetching during build
  if (!isBrowser) {
    console.log("[getSolanaRpcUrl] Skipping RPC URL fetch during build, using fallback");
    return "https://api.devnet.solana.com"; // Fallback during build
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch RPC URL: ${response.statusText}`);
    }
    const data = await response.json();
    const rpcUrl = data.rpcUrl;
    console.log("[getSolanaRpcUrl] Fetched RPC URL:", rpcUrl);
    return rpcUrl;
  } catch (error) {
    console.error("[getSolanaRpcUrl] Error fetching RPC URL:", error);
    const fallbackUrl = "https://api.devnet.solana.com"; // Fallback if needed
    console.log("[getSolanaRpcUrl] Using fallback RPC URL:", fallbackUrl);
    return fallbackUrl;
  }
}