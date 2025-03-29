"use client";

import { useWalletState } from "./WalletProvider";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isConnected, publicKey, walletName, connect, disconnect } = useWalletState();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Header: Wallet state - isConnected:", isConnected, "publicKey:", publicKey, "walletName:", walletName);
  }, [isConnected, publicKey, walletName]);

  const handleConnectClick = () => {
    if (isConnected) {
      disconnect();
      router.push("/");
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleWalletSelect = async (selectedWallet: string) => {
    setShowDropdown(false);
    await connect(selectedWallet);
  };

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold tracking-tight">Crowdfund</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button onClick={handleConnectClick} className="wallet-button">
            {isConnected && publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : "Connect Wallet"}
          </button>
          {!isConnected && showDropdown && (
            <div className="absolute top-full mt-2 right-0 bg-white border rounded shadow-md z-10">
              <button
                onClick={() => handleWalletSelect("Phantom")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
              >
                Phantom
              </button>
              <button
                onClick={() => handleWalletSelect("Solflare")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
              >
                Solflare
              </button>
            </div>
          )}
        </div>
        {isConnected && publicKey && (
          <button onClick={() => { disconnect(); router.push("/"); }} className="wallet-button bg-red-500 hover:bg-red-600">
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}