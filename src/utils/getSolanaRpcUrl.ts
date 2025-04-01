// utils/getSolanaRpcUrl.ts
export async function getSolanaRpcUrl(): Promise<string> {
    const res = await fetch('/api/solana-rpc');
    const data = await res.json();
  
    if (!res.ok || !data.rpcUrl) {
      throw new Error(data.error || 'Failed to retrieve RPC URL');
    }
  
    return data.rpcUrl;
  }
  