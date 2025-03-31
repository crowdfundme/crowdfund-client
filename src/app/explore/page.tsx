"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FundList from "../../components/FundList";
import { Fund } from "../../types";
import { toast, Toaster } from "sonner";

export default function Explore() {
  const [activeFunds, setActiveFunds] = useState<Fund[]>([]);
  const [completedFunds, setCompletedFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching active funds...");
      const activeUrl = `${process.env.NEXT_PUBLIC_API_URL}/funds?status=active`;
      console.log("Active funds URL:", activeUrl);
      const activeResponse = await axios.get(activeUrl);
      console.log("Active funds response:", activeResponse.data);
      console.log("Active fund IDs:", activeResponse.data.map((f: Fund) => f._id));
      setActiveFunds(activeResponse.data);

      console.log("Fetching completed funds...");
      const completedUrl = `${process.env.NEXT_PUBLIC_API_URL}/funds?status=completed`;
      console.log("Completed funds URL:", completedUrl);
      const completedResponse = await axios.get(completedUrl);
      console.log("Completed funds response:", completedResponse.data);
      console.log("Completed fund IDs:", completedResponse.data.map((f: Fund) => f._id));
      setCompletedFunds(completedResponse.data);
    } catch (error: any) {
      console.error("Failed to fetch funds:", error);
      const errorMsg = error.message || "Failed to fetch funds.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  return (
    <div className="p-6">
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Crowdfunds</h1>
        <input
          type="text"
          placeholder="Search by ID"
          className="border border-gray-300 rounded-lg p-2 w-48"
          disabled
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-600">Loading crowdfunds...</p>
      ) : activeFunds.length === 0 ? (
        <p className="text-gray-600 mb-6">No active crowdfunds available.</p>
      ) : (
        <FundList funds={activeFunds} status="active" onDonationSuccess={fetchFunds} />
      )}

      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Completed Crowdfunds</h2>
      {loading ? (
        <p className="text-gray-600">Loading completed crowdfunds...</p>
      ) : completedFunds.length === 0 ? (
        <p className="text-gray-600">No completed crowdfunds yet.</p>
      ) : (
        <FundList funds={completedFunds} status="completed" onDonationSuccess={fetchFunds} />
      )}
    </div>
  );
}