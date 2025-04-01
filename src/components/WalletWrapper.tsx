// src/components/WalletWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { CustomWalletProvider } from "./WalletProvider";
import { getSolanaRpcUrl } from "../utils/getSolanaRpcUrl";
import ClientLayout from "./ClientLayout";

export default function WalletWrapper({ children }: { children: React.ReactNode }) {
  const [rpcUrl, setRpcUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchRpcUrl = async () => {
      const url = await getSolanaRpcUrl();
      console.log("[WalletWrapper] Fetched RPC URL:", url);
      setRpcUrl(url);
    };
    fetchRpcUrl();
  }, []);

  if (!rpcUrl) {
    return <div>Loading Solana connection...</div>;
  }

  return (
    <CustomWalletProvider endpoint={rpcUrl}>
      <ClientLayout>{children}</ClientLayout>
    </CustomWalletProvider>
  );
}