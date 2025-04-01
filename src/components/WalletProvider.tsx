"use client";

import { FC, ReactNode, useEffect, useState, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderProps {
  children: ReactNode;
}

export const CustomWalletProvider: FC<WalletProviderProps> = ({ children }) => {  
  const [endpoint, setEndpoint] = useState<string | null>(null);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  useEffect(() => {
    const fetchRpc = async () => {
      try {
        const res = await fetch("/api/solana-rpc");
        const data = await res.json();
        setEndpoint(data.rpcUrl);
      } catch (err) {
        console.error("Failed to fetch Solana RPC endpoint", err);
      }
    };

    fetchRpc();
  }, []);

  if (!endpoint) return null; // Or return a loading spinner

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
