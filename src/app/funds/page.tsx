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
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching active funds for wallet:", publicKey.toBase58());
      const response = await axios.get("/api/backend/funds?status=active&page=1&limit=10");
      console.log("Active funds response:", response.data);
      setActiveFunds(response.data.funds);
    } catch (error) {
      console.error("Failed to fetch active funds:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
      }
      setError("Failed to fetch active funds.");
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = (updatedFund?: Fund) => {
    if (updatedFund) {
      console.log("Handling donation success for fund:", updatedFund._id, "Status:", updatedFund.status);
      setActiveFunds((prev) => {
        const updated = prev.map((f) => (f._id === updatedFund._id ? updatedFund : f));
        const filtered = updated.filter((f) => f.status === "active");
        console.log("Updated active funds after donation:", filtered);
        return filtered;
      });
    } else {
      console.log("No updated fund provided, refetching active funds...");
      fetchFunds();
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [publicKey]);

  return (
    <div className="p-6">
      {publicKey ? (
        <>
          <CreateFund />
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {loading ? (
            <p className="text-gray-600 mt-4">Loading active funds...</p>
          ) : activeFunds.length === 0 ? (
            <p className="text-gray-600 mt-4">No active funds available. Create one above!</p>
          ) : (
            <FundList funds={activeFunds} status="active" onDonationSuccess={handleDonationSuccess} />
          )}
        </>
      ) : (
        <p className="text-center">Please connect your wallet to view and create funds.</p>
      )}
    </div>
  );
}