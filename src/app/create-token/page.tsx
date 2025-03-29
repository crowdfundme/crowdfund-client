"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateFund from "../../components/CreateFund";

export default function CreateToken() {
  const { connected, publicKey } = useWallet();
  const { isWalletConnected } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!connected || !publicKey || !isWalletConnected) {
      console.log("CreateToken: Not connected, redirecting to /");
      router.push("/");
    }
  }, [connected, publicKey, isWalletConnected, router]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create a Fund</h2>
      {connected && publicKey ? (
        <>
          <p className="text-gray-600 mb-6">
            Connected as: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
          </p>
          <CreateFund />
        </>
      ) : (
        <p>Please connect your wallet to create a fund.</p>
      )}
    </div>
  );
}