"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import FundList from "@/components/FundList";
import { Fund } from "@/types";
import { toast, Toaster } from "sonner";
import Link from "next/link";

export default function ActiveFundsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fundsPerPage = 10;

  const fetchFunds = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching active funds, page ${pageNum}...`);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/funds?status=active&page=${pageNum}&limit=${fundsPerPage}`
      );
      console.log("Active funds response:", response.data);
      setFunds(response.data.funds);
      setTotalPages(response.data.pages);
    } catch (error: unknown) {
      console.error("Failed to fetch active funds:", error);
      const errorMsg = "Failed to fetch active funds.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = (updatedFund?: Fund) => {
    if (updatedFund) {
      setFunds((prev) =>
        prev.map((f) => (f._id === updatedFund._id ? updatedFund : f)).filter((f) => f.status === "active")
      );
    } else {
      fetchFunds(page);
    }
  };

  useEffect(() => {
    fetchFunds(page);
  }, [page]);

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

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-600">Loading active crowdfunds...</p>
      ) : funds.length === 0 ? (
        <p className="text-gray-600">No active crowdfunds available.</p>
      ) : (
        <>
          <FundList funds={funds} status="active" onDonationSuccess={handleDonationSuccess} />
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}