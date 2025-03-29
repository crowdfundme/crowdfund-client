"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import CreateFund from "../../components/CreateFund";
import FundList from "../../components/FundList";

export default function Funds() {
  const { publicKey } = useWallet();

  return (
    <div>
      {publicKey ? (
        <>
          <CreateFund />
          <FundList />
        </>
      ) : (
        <p className="text-center">Please connect your wallet to view and create funds.</p>
      )}
    </div>
  );
}