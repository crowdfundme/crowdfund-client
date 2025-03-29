"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUser } from "../context/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isWalletConnected, setIsWalletConnected } = useUser();
  const router = useRouter();

  useEffect(() => {
    console.log("Home: Wallet state - connected:", connected, "publicKey:", publicKey?.toBase58(), "wallet:", wallet?.adapter.name);
    if (connected !== isWalletConnected) {
      console.log("Home: Syncing isWalletConnected to", connected);
      setIsWalletConnected(connected);
      if (connected) {
        console.log("Home: Wallet connected, redirecting to /create-token");
        router.push("/create-token");
      }
    }
  }, [connected, isWalletConnected, setIsWalletConnected, publicKey, wallet, router]);

  const handleWalletClick = () => {
    console.log("Home: Wallet button clicked - connected:", connected, "publicKey:", publicKey?.toBase58());
    if (connected && publicKey) {
      disconnect();
    } else {
      console.log("Home: Opening wallet modal from Connect Wallet");
      setVisible(true);
    }
  };

  const handleTestModal = () => {
    console.log("Home: Test modal button clicked");
    setVisible(true);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4 flex-col gap-4">
      <button
        onClick={handleWalletClick}
        className="wallet-button"
        disabled={connecting}
      >
        {connecting
          ? "Connecting..."
          : connected && publicKey
          ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
          : "Connect Wallet"}
      </button>
      <button
        onClick={handleTestModal}
        className="wallet-button bg-green-500 hover:bg-green-600"
      >
        Test Modal
      </button>
    </div>
  );
}