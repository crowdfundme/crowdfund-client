// Cache the RPC URL to avoid repeated fetches
let cachedRpcUrl: string | null = null;

export async function getSolanaRpcUrl(): Promise<string> {
  if (cachedRpcUrl) {
    console.log("[getSolanaRpcUrl] Returning cached RPC URL:", cachedRpcUrl);
    return cachedRpcUrl;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_API_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/solana-rpc`;

  try {
    const res = await fetch(apiUrl);
    const text = await res.text();
    console.log(`[getSolanaRpcUrl] Raw response from ${apiUrl}:`, text);

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${text}`);
    }

    const data = JSON.parse(text);
    if (!data.rpcUrl) {
      throw new Error("No rpcUrl in response");
    }

    console.log("[getSolanaRpcUrl] Fetched RPC URL:", data.rpcUrl);
    cachedRpcUrl = data.rpcUrl; // Cache the result
    return data.rpcUrl;
  } catch (error) {
    console.error("[getSolanaRpcUrl] Error fetching RPC URL:", error);
    const fallbackUrl = "https://devnet.helius-rpc.com/?api-key=d93d31a2-04f9-407f-94e6-ed11077a8ffb";
    console.log("[getSolanaRpcUrl] Using fallback RPC URL:", fallbackUrl);
    cachedRpcUrl = fallbackUrl; // Cache fallback too
    return fallbackUrl;
  }
}