"use client";

import { useWalletState } from "../components/WalletProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isConnected, publicKey, walletName, connect, disconnect } = useWalletState();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Home: Wallet state - isConnected:", isConnected, "publicKey:", publicKey, "walletName:", walletName);
    if (isConnected && publicKey) {
      console.log("Home: Connected, redirecting to /create-token...");
      router.push("/create-token");
    }
  }, [isConnected, publicKey, walletName, router]);

  const handleConnectClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleWalletSelect = async (selectedWallet: string) => {
    setShowDropdown(false);
    await connect(selectedWallet);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4 flex-col gap-4">
      <div className="relative">
        <button onClick={handleConnectClick} className="wallet-button">
          {isConnected && publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : "Connect Wallet"}
        </button>
        {!isConnected && showDropdown && (
          <div className="absolute top-full mt-2 right-0 bg-white border rounded shadow-md z-10">
            <button
              onClick={() => handleWalletSelect("Phantom")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Phantom
            </button>
            <button
              onClick={() => handleWalletSelect("Solflare")}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Solflare
            </button>
          </div>
        )}
      </div>
      {isConnected && publicKey && (
        <button onClick={disconnect} className="wallet-button bg-red-500 hover:bg-red-600">
          Disconnect
        </button>
      )}
    </div>
  );
}