"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FundList from "@/components/FundList";
import { Fund } from "@/types";
import Link from "next/link";
import { toast } from "sonner";

export default function ExplorePage() {
  const [activeFunds, setActiveFunds] = useState<Fund[]>([]);
  const [completedFunds, setCompletedFunds] = useState<Fund[]>([]);
  const [searchResults, setSearchResults] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCache, setSearchCache] = useState<Record<string, Fund[]>>({}); // In-memory cache

  const fetchFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching latest active funds...");
      const activeResponse = await axios.get("/api/backend/funds?status=active&page=1&limit=5");
      console.log("Active funds response:", activeResponse.data);
      setActiveFunds(activeResponse.data.funds);

      console.log("Fetching latest completed funds...");
      const completedResponse = await axios.get("/api/backend/funds?status=completed&page=1&limit=5");
      console.log("Completed funds response:", completedResponse.data);
      const sortedCompleted = completedResponse.data.funds.sort((a: Fund, b: Fund) =>
        new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
      );
      setCompletedFunds(sortedCompleted);
    } catch (error) {
      console.error("Error calling /api/backend/funds:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
      }
      const errorMsg = "Failed to fetch funds.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    // Check cache first
    if (searchCache[term]) {
      console.log(`Cache hit for term: ${term}`);
      setSearchResults(searchCache[term]);
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      console.log(`Searching funds with term: ${term}`);

      // Search active funds
      const activeResponse = await axios.get(
        `/api/backend/funds?status=active&search=${encodeURIComponent(term)}&page=1&limit=10`
      );
      console.log("Active search results:", activeResponse.data);

      // Search completed funds
      const completedResponse = await axios.get(
        `/api/backend/funds?status=completed&search=${encodeURIComponent(term)}&page=1&limit=10`
      );
      console.log("Completed search results:", completedResponse.data);

      // Combine and deduplicate results
      const combinedResults = [
        ...activeResponse.data.funds,
        ...completedResponse.data.funds,
      ].reduce((unique: Fund[], fund: Fund) => {
        if (!unique.some((f) => f._id === fund._id)) {
          unique.push(fund);
        }
        return unique;
      }, []);

      // Sort results with proper type checking
      const sortedResults = combinedResults.sort((a: Fund, b: Fund) => {
        if (a.status === "completed" && b.status === "completed") {
          const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bDate - aDate;
        }
        if (a.status === "active" && b.status === "active") {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        }
        return a.status === "completed" ? 1 : -1; // Completed funds after active
      });

      setSearchResults(sortedResults);
      setSearchCache((prev) => ({ ...prev, [term]: sortedResults })); // Store in cache
    } catch (error) {
      console.error("Error searching funds:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
      }
      const errorMsg = "Failed to search funds.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 3) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500); // Increased from 300ms to 500ms
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleDonationSuccess = (updatedFund?: Fund) => {
    if (updatedFund) {
      console.log("Handling donation success for fund:", {
        id: updatedFund._id,
        status: updatedFund.status,
        currentDonatedSol: updatedFund.currentDonatedSol,
        targetSolAmount: updatedFund.targetSolAmount,
      });
      setActiveFunds((prev) => {
        const updated = prev.map((f) => (f._id === updatedFund._id ? updatedFund : f));
        const filtered = updated.filter((f) => f.status === "active");
        console.log("Updated activeFunds after donation:", filtered);
        return filtered;
      });
      setCompletedFunds((prev) => {
        const filtered = prev.filter((f) => f._id !== updatedFund._id);
        const newCompleted = updatedFund.status === "completed" ? [...filtered, updatedFund] : filtered;
        const sorted = newCompleted.sort((a, b) =>
          new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
        );
        console.log("Updated completedFunds after donation:", sorted);
        return sorted.slice(0, 5);
      });
      setSearchResults((prev) =>
        prev.map((f) => (f._id === updatedFund._id ? updatedFund : f))
      );
      // Update cache if the updated fund affects cached results
      setSearchCache((prev) => {
        const newCache = { ...prev };
        Object.keys(newCache).forEach((term) => {
          newCache[term] = newCache[term].map((f) =>
            f._id === updatedFund._id ? updatedFund : f
          );
        });
        return newCache;
      });
    } else {
      console.log("No updated fund provided, refetching all funds...");
      fetchFunds();
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontWeight: 300 }}>
          Crowdfunds
        </h1>
        <input
          type="text"
          placeholder="Search by ID, name, or token"
          className="border border-gray-300 rounded-lg p-2 w-full max-w-md mx-auto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {searchTerm && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Search Results</h2>
          {searchLoading ? (
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Searching...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-gray-600 text-center">No funds found matching "{searchTerm}".</p>
          ) : (
            <FundList funds={searchResults} status="mixed" onDonationSuccess={handleDonationSuccess} />
          )}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center" style={{ fontWeight: 300 }}>
          Active Crowdfunds
        </h2>
        {loading ? (
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading active crowdfunds...</span>
          </div>
        ) : activeFunds.length === 0 ? (
          <p className="text-gray-600 mb-6 text-center">No active crowdfunds available.</p>
        ) : (
          <>
            <FundList funds={activeFunds} status="active" onDonationSuccess={handleDonationSuccess} />
            <div className="flex justify-start mt-4">
              <Link href="/active">
                <button className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200">
                  More Active
                </button>
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center" style={{ fontWeight: 300 }}>
          Completed Crowdfunds
        </h2>
        {loading ? (
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading completed crowdfunds...</span>
          </div>
        ) : completedFunds.length === 0 ? (
          <p className="text-gray-600 text-center">No completed crowdfunds yet.</p>
        ) : (
          <>
            <FundList funds={completedFunds} status="completed" onDonationSuccess={handleDonationSuccess} />
            <div className="flex justify-start mt-4">
              <Link href="/completed">
                <button className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200">
                  More Completed
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}