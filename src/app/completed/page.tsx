"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import FundList from "@/components/FundList";
import { Fund } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

export default function CompletedFundsPage() {
  const [state, setState] = useState({
    funds: [] as Fund[],
    loading: true,
    error: null as string | null,
    page: 1,
    totalPages: 0,
    totalFunds: 0,
  });
  const fundsPerPage = 10;

  const fetchFunds = useCallback(async (pageNum: number) => {
    try {
      console.log(`[fetchFunds] Starting fetch for page ${pageNum}, current state - totalFunds: ${state.totalFunds}, totalPages: ${state.totalPages}`);
      setState((prev) => ({ ...prev, loading: true, error: null }));
      console.log(`[fetchFunds] Fetching completed funds, page ${pageNum}...`);

      const url = `/api/backend/funds?status=completed&page=${pageNum}&limit=${fundsPerPage}`;
      console.log(`[fetchFunds] Request URL: ${url}`);
      const response = await axios.get(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      console.log("[fetchFunds] Completed funds response:", response.data);
      console.log("[fetchFunds] Response headers:", response.headers);

      const { funds, total, pages } = response.data;

      if (!Array.isArray(funds) || typeof total !== "number" || typeof pages !== "number") {
        throw new Error("Invalid API response format");
      }
      if (funds.length > fundsPerPage) {
        console.warn(`[fetchFunds] Received ${funds.length} funds, expected max ${fundsPerPage}`);
      }

      const sortedFunds = funds.sort((a: Fund, b: Fund) =>
        new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
      );

      console.log(`[fetchFunds] Before state update - funds.length: ${sortedFunds.length}, total: ${total}, pages: ${pages}`);
      setState((prev) => {
        const newState = {
          ...prev,
          funds: sortedFunds,
          totalFunds: total,
          totalPages: Math.ceil(total / fundsPerPage),
        };
        console.log(`[fetchFunds] Setting state - funds.length: ${sortedFunds.length}, totalFunds: ${total}, totalPages: ${Math.ceil(total / fundsPerPage)}`);
        return newState;
      });
    } catch (error) {
      console.error("[fetchFunds] Failed to fetch completed funds:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("[fetchFunds] Server response:", error.response.data);
      }
      const errorMsg = "Failed to fetch completed funds.";
      setState((prev) => ({ ...prev, error: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
      console.log("[fetchFunds] Fetch completed, loading: false");
    }
  }, []);

  const handleDonationSuccess = useCallback((updatedFund?: Fund) => {
    if (updatedFund) {
      console.log("[handleDonationSuccess] Handling donation success for fund:", updatedFund._id, "Status:", updatedFund.status);
      setState((prev) => {
        const updated = prev.funds.map((f) => (f._id === updatedFund._id ? updatedFund : f));
        const sorted = updated.sort((a, b) =>
          new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
        );
        console.log("[handleDonationSuccess] Updated completed funds after donation:", sorted);
        return { ...prev, funds: sorted };
      });
    } else {
      console.log("[handleDonationSuccess] No updated fund provided, refetching completed funds...");
      fetchFunds(state.page);
    }
  }, [state.page, fetchFunds]);

  useEffect(() => {
    console.log(`[useEffect] Triggered with page: ${state.page}, totalFunds: ${state.totalFunds}, totalPages: ${state.totalPages}`);
    fetchFunds(state.page);
  }, [state.page, fetchFunds]);

  useEffect(() => {
    console.log(`[stateEffect] State updated - funds.length: ${state.funds.length}, totalFunds: ${state.totalFunds}, totalPages: ${state.totalPages}`);
  }, [state.funds, state.totalFunds, state.totalPages]);

  console.log(`[render] Rendering - page: ${state.page}, totalFunds: ${state.totalFunds}, totalPages: ${state.totalPages}`);

  const startIndex = (state.page - 1) * fundsPerPage + 1;
  const endIndex = Math.min(state.page * fundsPerPage, state.totalFunds);

  return (
    <div className="p-6">      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontWeight: 300 }}>
          Completed Crowdfunds
        </h1>
        <Link href="/explore">
          <button className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200">
            Back
          </button>
        </Link>
      </div>

      {state.error && <p className="text-red-500 mb-4">{state.error}</p>}

      {state.loading ? (
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
      ) : state.funds.length === 0 ? (
        <p className="text-gray-600">No completed crowdfunds yet.</p>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            Showing {startIndex}-{endIndex} of {state.totalFunds} completed crowdfunds
          </p>
          <FundList funds={state.funds} status="completed" onDonationSuccess={handleDonationSuccess} />
          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                const newPage = Math.max(state.page - 1, 1);
                console.log(`[Previous Button] Changing page from ${state.page} to ${newPage}`);
                setState((prev) => ({ ...prev, page: newPage }));
              }}
              disabled={state.page === 1}
              className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200 disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="self-center">
              Page {state.page} of {state.totalPages || 1}
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(state.page + 1, state.totalPages);
                console.log(`[Next Button] Changing page from ${state.page} to ${newPage}, totalPages: ${state.totalPages}`);
                setState((prev) => ({ ...prev, page: newPage }));
              }}
              disabled={state.page >= state.totalPages}
              className="px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200 disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}