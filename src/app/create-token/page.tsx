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
      {connected && publicKey ? (
        <CreateFund />
      ) : (
        <p>Please connect your wallet to create a fund.</p>
      )}
    </div>
  );
}