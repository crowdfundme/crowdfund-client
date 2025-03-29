"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import CreateFund from "../../components/CreateFund";
import FundList from "../../components/FundList";
import { Fund } from "../../types";

export default function Funds() {
  const { publicKey } = useWallet();
  const [activeFunds, setActiveFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunds = async () => {
      if (!publicKey) return; // Only fetch if wallet is connected

      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=active`);
        setActiveFunds(response.data);
      } catch (error) {
        console.error("Failed to fetch active funds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, [publicKey]); // Re-fetch when publicKey changes (e.g., on connect/disconnect)

  return (
    <div>
      {publicKey ? (
        <>
          <CreateFund />
          {loading ? (
            <p className="text-gray-600 mt-4">Loading active funds...</p>
          ) : activeFunds.length === 0 ? (
            <p className="text-gray-600 mt-4">No active funds available. Create one above!</p>
          ) : (
            <FundList funds={activeFunds} status="active" />
          )}
        </>
      ) : (
        <p className="text-center">Please connect your wallet to view and create funds.</p>
      )}
    </div>
  );
}