"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FundList from "@/components/FundList";
import { Fund } from "@/types";
import { toast, Toaster } from "sonner";
import Link from "next/link";

export default function ExplorePage() {
  const [activeFunds, setActiveFunds] = useState<Fund[]>([]);
  const [completedFunds, setCompletedFunds] = useState<Fund[]>([]);
  const [searchResults, setSearchResults] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch initial active and completed funds
  const fetchFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching latest active funds...");
      const activeResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=active&page=1&limit=5`);
      console.log("Active funds response:", activeResponse.data);
      setActiveFunds(activeResponse.data.funds);

      console.log("Fetching latest completed funds...");
      const completedResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=completed&page=1&limit=5`);
      console.log("Completed funds response:", completedResponse.data);
      setCompletedFunds(completedResponse.data.funds);
    } catch (error: unknown) {
      console.error("Failed to fetch funds:", error);
      const errorMsg = "Failed to fetch funds.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      console.log(`Searching funds with term: ${term}`);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/funds?search=${encodeURIComponent(term)}&page=1&limit=10`
      );
      console.log("Search results:", response.data);
      setSearchResults(response.data.funds);
    } catch (error: unknown) {
      console.error("Failed to search funds:", error);
      const errorMsg = "Failed to search funds.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleDonationSuccess = (updatedFund?: Fund) => {
    if (updatedFund) {
      setActiveFunds((prev) =>
        prev.map((f) => (f._id === updatedFund._id ? updatedFund : f)).filter((f) => f.status === "active")
      );
      setCompletedFunds((prev) =>
        updatedFund.status === "completed"
          ? [...prev.filter((f) => f._id !== updatedFund._id), updatedFund]
          : prev
      );
      setSearchResults((prev) =>
        prev.map((f) => (f._id === updatedFund._id ? updatedFund : f))
      );
    } else {
      fetchFunds();
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
          placeholder="Search by ID, name, or token"
          className="border border-gray-300 rounded-lg p-2 w-48"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Search Results */}
      {searchTerm && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Results</h2>
          {searchLoading ? (
            <p className="text-gray-600">Searching...</p>
          ) : searchResults.length === 0 ? (
            <p className="text-gray-600">No funds found matching "{searchTerm}".</p>
          ) : (
            <FundList funds={searchResults} status="mixed" onDonationSuccess={handleDonationSuccess} />
          )}
        </div>
      )}

      {/* Active Funds */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Active Crowdfunds</h2>
        {loading ? (
          <p className="text-gray-600">Loading active crowdfunds...</p>
        ) : activeFunds.length === 0 ? (
          <p className="text-gray-600 mb-6">No active crowdfunds available.</p>
        ) : (
          <>
            <FundList funds={activeFunds} status="active" onDonationSuccess={handleDonationSuccess} />
            <Link href="/active">
              <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                More Active Crowdfunds
              </button>
            </Link>
          </>
        )}
      </div>

      {/* Completed Funds */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Completed Crowdfunds</h2>
        {loading ? (
          <p className="text-gray-600">Loading completed crowdfunds...</p>
        ) : completedFunds.length === 0 ? (
          <p className="text-gray-600">No completed crowdfunds yet.</p>
        ) : (
          <>
            <FundList funds={completedFunds} status="completed" onDonationSuccess={handleDonationSuccess} />
            <Link href="/completed">
              <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                More Completed Crowdfunds
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}