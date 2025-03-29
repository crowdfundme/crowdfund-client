"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  // Only include wallets exported by @solana/wallet-adapter-wallets
} from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
import { connection } from "../lib/solana";
import { UserProvider } from "../context/UserContext";

export default function WalletProviderComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    // Add more wallets via Wallet Standard or manual testing later
  ], []);

  return (
    <ConnectionProvider endpoint={connection.rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <UserProvider>{children}</UserProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}