"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FundList from "../../components/FundList";
import { Fund } from "../../types";

export default function Explore() {
  const [activeFunds, setActiveFunds] = useState<Fund[]>([]);
  const [completedFunds, setCompletedFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setLoading(true);
        console.log("Fetching active funds...");
        const activeResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=active`);
        console.log("Active funds response:", activeResponse.data);
        setActiveFunds(activeResponse.data);

        console.log("Fetching completed funds...");
        const completedResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=completed`);
        console.log("Completed funds response:", completedResponse.data);
        setCompletedFunds(completedResponse.data);
      } catch (error) {
        console.error("Failed to fetch funds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Crowdfunds</h1>
        <input
          type="text"
          placeholder="Search by ID"
          className="border border-gray-300 rounded-lg p-2 w-48"
          disabled
        />
      </div>

      {loading ? (
        <p className="text-gray-600">Loading crowdfunds...</p>
      ) : activeFunds.length === 0 ? (
        <p className="text-gray-600 mb-6">No active crowdfunds available.</p>
      ) : (
        <FundList funds={activeFunds} status="active" />
      )}

      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Completed Crowdfunds</h2>
      {loading ? (
        <p className="text-gray-600">Loading completed crowdfunds...</p>
      ) : completedFunds.length === 0 ? (
        <p className="text-gray-600">No completed crowdfunds yet.</p>
      ) : (
        <FundList funds={completedFunds} status="completed" />
      )}
    </div>
  );
}