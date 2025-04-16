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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <svg
          className="animate-spin h-10 w-10 text-black mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-gray-700 text-lg font-medium">Connecting to Crowdfund.fun...</p>
      </div>
    );
  }

  return (
    <CustomWalletProvider endpoint={rpcUrl}>
      <ClientLayout>{children}</ClientLayout>
    </CustomWalletProvider>
  );
}