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
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [activeTotalPages, setActiveTotalPages] = useState(1);
  const [completedTotalPages, setCompletedTotalPages] = useState(1);
  const fundsPerPage = 10;

  const fetchFunds = async (status: "active" | "completed", page: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching ${status} funds, page ${page}...`);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/funds?status=${status}&page=${page}&limit=${fundsPerPage}`;
      console.log(`${status} funds URL:`, url);
      const response = await axios.get(url);
      console.log(`${status} funds response:`, response.data);
      console.log(`${status} fund IDs:`, response.data.funds.map((f: Fund) => f._id));
      if (status === "active") {
        setActiveFunds(response.data.funds);
        setActiveTotalPages(response.data.pages);
      } else {
        setCompletedFunds(response.data.funds);
        setCompletedTotalPages(response.data.pages);
      }
    } catch (error: unknown) {
      console.error(`Failed to fetch ${status} funds:`, error);
      const errorMsg = `Failed to fetch ${status} funds.`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
    } else {
      fetchFunds("active", activePage);
      fetchFunds("completed", completedPage);
    }
  };

  useEffect(() => {
    fetchFunds("active", activePage);
    fetchFunds("completed", completedPage);
  }, [activePage, completedPage]);

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

      <div>
        {loading ? (
          <p className="text-gray-600">Loading crowdfunds...</p>
        ) : activeFunds.length === 0 ? (
          <p className="text-gray-600 mb-6">No active crowdfunds available.</p>
        ) : (
          <>
            <FundList
              funds={activeFunds}
              status="active"
              onDonationSuccess={handleDonationSuccess}
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setActivePage((prev) => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {activePage} of {activeTotalPages}
              </span>
              <button
                onClick={() => setActivePage((prev) => prev + 1)}
                disabled={activePage >= activeTotalPages}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Completed Crowdfunds</h2>
      <div>
        {loading ? (
          <p className="text-gray-600">Loading completed crowdfunds...</p>
        ) : completedFunds.length === 0 ? (
          <p className="text-gray-600">No completed crowdfunds yet.</p>
        ) : (
          <>
            <FundList
              funds={completedFunds}
              status="completed"
              onDonationSuccess={handleDonationSuccess}
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCompletedPage((prev) => Math.max(prev - 1, 1))}
                disabled={completedPage === 1}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {completedPage} of {completedTotalPages}
              </span>
              <button
                onClick={() => setCompletedPage((prev) => prev + 1)}
                disabled={completedPage >= completedTotalPages}
                className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}