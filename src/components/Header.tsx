"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { connected, publicKey, disconnect, connecting, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { isWalletConnected, setIsWalletConnected } = useUser();
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Header: Wallet state - connected:", connected, "publicKey:", publicKey?.toBase58(), "wallet:", wallet?.adapter.name);
    if (connected !== isWalletConnected) {
      console.log("Header: Syncing isWalletConnected to", connected);
      setIsWalletConnected(connected);
    }
  }, [connected, isWalletConnected, setIsWalletConnected, publicKey, wallet]);

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
    router.push("/");
  };

  const handleTestModal = () => {
    console.log("Header: Test modal button clicked");
    setVisible(true);
  };

  return (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-2">
        <a href="/">
          <div className="w-9 h-9 lg:w-12 lg:h-12 max-w-[150px]">
            <img src="/logo.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
        </a>
      </div>
      <div className="relative flex items-center gap-4">
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
        {connected && publicKey && isWalletMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 text-white border rounded-lg shadow-xl z-10">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded-lg"
            >
              Disconnect
            </button>
          </div>
        )}
        <button
          onClick={handleTestModal}
          className="wallet-button bg-green-500 hover:bg-green-600"
        >
          Test Modal
        </button>
      </div>
    </header>
  );
}