"use client";

import { useWalletState } from "../../components/WalletProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateToken() {
  const { isConnected, publicKey } = useWalletState();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected || !publicKey) {
      console.log("CreateToken: Not connected, redirecting to /");
      router.push("/");
    }
  }, [isConnected, publicKey, router]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Create a Token</h2>
      {isConnected && publicKey ? (
        <p>Connected as: {publicKey}</p>
      ) : (
        <p>Please connect your wallet to create a token.</p>
      )}
    </div>
  );
}