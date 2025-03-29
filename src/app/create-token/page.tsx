"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useUser } from "../../context/UserContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
      <h2 className="text-2xl font-bold mb-4">Create a Token</h2>
      {connected && publicKey ? (
        <p>Connected as: {publicKey.toBase58()}</p>
      ) : (
        <p>Please connect your wallet to create a token.</p>
      )}
    </div>
  );
}