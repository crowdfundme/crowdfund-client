// src/utils/getSolanaRpcUrl.ts
/*export async function getSolanaRpcUrl(): Promise<string> {
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
    const fallbackUrl = "https://api.devnet.solana.com";
    console.log("[getSolanaRpcUrl] Using fallback RPC URL:", fallbackUrl);
    return fallbackUrl;
  }
}*/


/*export async function getSolanaRpcUrl(): Promise<string> {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet";
  const directRpc = network === "mainnet"
    ? "https://mainnet.helius-rpc.com/?api-key=d93d31a2-04f9-407f-94e6-ed11077a8ffb"
    : "https://devnet.helius-rpc.com/?api-key=d93d31a2-04f9-407f-94e6-ed11077a8ffb";
  console.log("[getSolanaRpcUrl] Using direct RPC:", directRpc);
  return directRpc;
}*/

// crowd-fund-client/src/utils/getSolanaRpcUrl.ts
export async function getSolanaRpcUrl(): Promise<string> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const response = await fetch(`${backendUrl}/get-rpc-url`);
    if (!response.ok) {
      throw new Error(`Failed to fetch RPC URL: ${response.statusText}`);
    }
    const data = await response.json();
    const rpcUrl = data.rpcUrl;
    console.log("[solana.ts] Fetched RPC URL:", rpcUrl);
    return rpcUrl;
  } catch (error) {
    console.error("[solana.ts] Error fetching RPC URL:", error);
    throw error; // Let the caller handle the fallback or error
  }
}