"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

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

  const handleCreateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!connected) {
      e.preventDefault(); // Prevent navigation if wallet is not connected      
      setVisible(true); // Open wallet modal
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] px-4 flex flex-col gap-6">      
      <h1
        className="text-6xl font-light text-gray-900 text-center mt-8"
        style={{ fontWeight: 300 }}
      >
        Crowdfund.fun
      </h1>
      {/* Create Button - Centered below */}
      <div className="flex justify-center">
        <Link href="/create-token" onClick={handleCreateClick}>
          <button className="text-gray-900 underline hover:text-gray-600 font-medium text-lg">
            Create
          </button>
        </Link>
      </div>
    </div>
  );
}