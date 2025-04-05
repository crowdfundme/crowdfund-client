// app/utils/getSolanaRpcUrl.ts
export async function getSolanaRpcUrl(): Promise<string> {
  try {
    const response = await fetch("/api/solana-rpc", { cache: "no-store" });
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