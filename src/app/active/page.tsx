"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import FundList from "@/components/FundList";
import { Fund } from "@/types";
import { toast, Toaster } from "sonner";
import Link from "next/link";

export default function ActiveFundsPage() {
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
      console.log(`[fetchFunds] Fetching active funds, page ${pageNum}...`);

      const url = `/api/backend/funds?status=active&page=${pageNum}&limit=${fundsPerPage}`;
      console.log(`[fetchFunds] Request URL: ${url}`);
      const response = await axios.get(url, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      console.log("[fetchFunds] Active funds response:", response.data);
      console.log("[fetchFunds] Response headers:", response.headers);

      const { funds, total, pages } = response.data;

      if (!Array.isArray(funds) || typeof total !== "number" || typeof pages !== "number") {
        throw new Error("Invalid API response format");
      }
      if (funds.length > fundsPerPage) {
        console.warn(`[fetchFunds] Received ${funds.length} funds, expected max ${fundsPerPage}`);
      }

      console.log(`[fetchFunds] Before state update - funds.length: ${funds.length}, total: ${total}, pages: ${pages}`);
      setState((prev) => {
        const newState = {
          ...prev,
          funds,
          totalFunds: total,
          totalPages: Math.ceil(total / fundsPerPage),
        };
        console.log(`[fetchFunds] Setting state - funds.length: ${funds.length}, totalFunds: ${total}, totalPages: ${Math.ceil(total / fundsPerPage)}`);
        return newState;
      });
    } catch (error) {
      console.error("[fetchFunds] Failed to fetch active funds:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("[fetchFunds] Server response:", error.response.data);
      }
      const errorMsg = "Failed to fetch active funds.";
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
      if (updatedFund.status !== "active") {
        console.log("[handleDonationSuccess] Fund status changed, refetching active funds...");
        fetchFunds(state.page);
      } else {
        setState((prev) => {
          const updatedFunds = prev.funds.map((f) => (f._id === updatedFund._id ? updatedFund : f));
          console.log("[handleDonationSuccess] Updated active funds:", updatedFunds);
          return { ...prev, funds: updatedFunds };
        });
      }
    } else {
      console.log("[handleDonationSuccess] No updated fund provided, refetching active funds...");
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
      <Toaster position="top-right" richColors />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Active Crowdfunds</h1>
        <Link href="/explore">
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Back to Explore
          </button>
        </Link>
      </div>

      {state.error && <p className="text-red-500 mb-4">{state.error}</p>}

      {state.loading ? (
        <p className="text-gray-600">Loading active crowdfunds...</p>
      ) : state.funds.length === 0 ? (
        <p className="text-gray-600">No active crowdfunds available.</p>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            Showing {startIndex}-{endIndex} of {state.totalFunds} active crowdfunds
          </p>
          <FundList funds={state.funds} status="active" onDonationSuccess={handleDonationSuccess} />
          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                const newPage = Math.max(state.page - 1, 1);
                console.log(`[Previous Button] Changing page from ${state.page} to ${newPage}`);
                setState((prev) => ({ ...prev, page: newPage }));
              }}
              disabled={state.page === 1}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
            >
              Previous
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
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}