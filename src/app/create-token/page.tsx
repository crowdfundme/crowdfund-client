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
    <div className="flex justify-center p-4 sm:p-6">
      {connected && publicKey ? (
        <div className="w-full max-w-full sm:max-w-3xl">
          <CreateFund />
        </div>
      ) : (
        <div className="flex justify-center items-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-t-4 border-t-black rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}