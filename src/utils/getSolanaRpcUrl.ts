// src/utils/getSolanaRpcUrl.ts
export async function getSolanaRpcUrl(): Promise<string> {
  const apiUrl = "/api/solana-rpc";

  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
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
    return data.rpcUrl;
  } catch (error) {
    console.error("[getSolanaRpcUrl] Error fetching RPC URL:", error);
    const fallbackUrl = "https://devnet.helius-rpc.com/?api-key=d93d31a2-04f9-407f-94e6-ed11077a8ffb";
    console.log("[getSolanaRpcUrl] Using fallback RPC URL:", fallbackUrl);
    return fallbackUrl;
  }
}