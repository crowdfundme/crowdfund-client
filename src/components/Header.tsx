"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Header() {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isWalletConnected, setIsWalletConnected } = useUser();
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Header: useEffect running - connected:", connected, "isWalletConnected:", isWalletConnected, "publicKey:", publicKey?.toBase58());
    if (connected !== isWalletConnected) {
      console.log("Header: Syncing isWalletConnected to", connected);
      setIsWalletConnected(connected);

      // Register user on connect
      if (connected && publicKey) {
        registerUser(publicKey.toBase58());
      }
    }
  }, [connected, isWalletConnected, publicKey, wallet]);

  const registerUser = async (walletAddress: string) => {
    if (sessionStorage.getItem(`registered_${walletAddress}`)) {
      console.log("Header: User already registered for wallet:", walletAddress);
      return;
    }

    try {
      console.log("Header: Registering user with wallet:", walletAddress);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        walletAddress,
      });
      console.log("Header: User registered:", response.data);
      sessionStorage.setItem(`registered_${walletAddress}`, "true");
    } catch (error) {
      console.error("Header: Failed to register user:", error);
    }
  };

  const handleWalletClick = () => {
    console.log("Header: Wallet button clicked - connected:", connected, "publicKey:", publicKey?.toBase58());
    if (connected && publicKey) {
      setIsWalletMenuOpen(!isWalletMenuOpen);
    } else {
      console.log("Header: Opening wallet modal from Connect Wallet");
      setIsWalletMenuOpen(false);
      setVisible(true);
    }
  };

  const handleDisconnect = async () => {
    console.log("Header: Disconnect clicked");
    await disconnect();
    setIsWalletMenuOpen(false);
    router.push("/explore");
  };

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-2">
        <a href="/explore">
          <div className="w-9 h-9 lg:w-12 lg:h-12 max-w-[150px]">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
        </a>
      </div>
      <div className="relative">
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
        {connected && publicKey && isWalletMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-xl z-10">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
}