"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { connection } from "../lib/solana";

export const WalletStateContext = createContext<{
  isConnected: boolean;
  publicKey: string | null;
  walletName: string | null;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
}>({
  isConnected: false,
  publicKey: null,
  walletName: null,
  connect: async () => {},
  disconnect: async () => {},
});

export default function WalletProviderComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);

  useEffect(() => {
    const phantom = wallets.find(w => w.name === "Phantom");
    const solflare = wallets.find(w => w.name === "Solflare");

    const setupWalletListeners = (wallet: any) => {
      wallet.on("connect", () => {
        console.log(`${wallet.name} connected:`, wallet.publicKey?.toBase58());
        setIsConnected(true);
        setPublicKey(wallet.publicKey?.toBase58() || null);
        setWalletName(wallet.name);
      });
      wallet.on("disconnect", () => {
        console.log(`${wallet.name} disconnected`);
        setIsConnected(false);
        setPublicKey(null);
        setWalletName(null);
      });
      wallet.on("error", (error: Error) => console.error(`${wallet.name} error:`, error));
    };

    if (phantom) setupWalletListeners(phantom);
    if (solflare) setupWalletListeners(solflare);

    const autoConnectWallet = phantom?.readyState === "Installed" ? phantom : solflare?.readyState === "Installed" ? solflare : null;
    if (autoConnectWallet) {
      console.log(`WalletProvider: Attempting auto-connect to ${autoConnectWallet.name}...`);
      if (autoConnectWallet.connected) {
        console.log(`${autoConnectWallet.name} already connected:`, autoConnectWallet.publicKey?.toBase58());
        setIsConnected(true);
        setPublicKey(autoConnectWallet.publicKey?.toBase58() || null);
        setWalletName(autoConnectWallet.name);
      } else {
        autoConnectWallet.connect().catch((err) => console.error(`Auto-connect to ${autoConnectWallet.name} failed:`, err));
      }
    } else {
      console.log("WalletProvider: No supported wallets detected.");
    }

    return () => {
      if (phantom) {
        phantom.off("connect");
        phantom.off("disconnect");
        phantom.off("error");
      }
      if (solflare) {
        solflare.off("connect");
        solflare.off("disconnect");
        solflare.off("error");
      }
    };
  }, [wallets]);

  const connect = async (selectedWalletName: string) => {
    const wallet = wallets.find(w => w.name === selectedWalletName);
    if (wallet && wallet.readyState === "Installed" && !wallet.connected) {
      console.log(`Connecting to ${selectedWalletName}...`);
      await wallet.connect();
    } else {
      console.log(`${selectedWalletName} not available or already connected`);
    }
  };

  const disconnect = async () => {
    const connectedWallet = wallets.find(w => w.connected);
    if (connectedWallet) {
      console.log(`Disconnecting from ${connectedWallet.name}...`);
      await connectedWallet.disconnect();
    }
  };

  return (
    <ConnectionProvider endpoint={connection.rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletStateContext.Provider value={{ isConnected, publicKey, walletName, connect, disconnect }}>
            {children}
          </WalletStateContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export const useWalletState = () => useContext(WalletStateContext);