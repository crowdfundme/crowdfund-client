"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect } from "react";

export default function Home() {
  const { connected, publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = () => {
    console.log("Home: Wallet button clicked - connected:", connected, "publicKey:", publicKey?.toBase58());
    if (connected && publicKey) {
      disconnect();
    } else {
      console.log("Home: Opening wallet modal from Connect Wallet");
      setVisible(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4 flex-col gap-4">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to Crowdfund</h1>
      <p className="text-gray-600 mb-4">Connect your Solana wallet to get started.</p>
      <button
        onClick={handleWalletClick}
        className="solana-wallet-button"
        disabled={connecting}
      >
        {connecting
          ? "Connecting..."
          : connected && publicKey
          ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
          : "Connect Wallet"}
      </button>
    </div>
  );
}