"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Fund } from "@/types";

interface TotalDonatedUser {
  walletAddress: string;
  totalDonatedSol: number;
}

interface FundLeaderboardUser {
  walletAddress: string;
  totalForFund: number;
}

export default function LeaderboardPage() {
  const [totalLeaderboard, setTotalLeaderboard] = useState<TotalDonatedUser[]>([]);
  const [fundLeaderboard, setFundLeaderboard] = useState<FundLeaderboardUser[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [fundName, setFundName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch total leaderboard
        const totalResponse = await axios.get("/api/backend/users/leaderboard/total");
        console.log("Total leaderboard response:", totalResponse.data);
        setTotalLeaderboard(Array.isArray(totalResponse.data) ? totalResponse.data : []);

        // Fetch active funds
        const fundsResponse = await axios.get("/api/backend/funds?status=active");
        console.log("Funds response:", fundsResponse.data);
        const fundsData = Array.isArray(fundsResponse.data.funds) ? fundsResponse.data.funds : [];
        setFunds(fundsData);
        if (fundsData.length > 0) {
          setSelectedFundId(fundsData[0]._id);
        } else {
          setSelectedFundId(null);
        }
      } catch (error) {
        console.error("Error calling /api/backend/users/leaderboard/total or /funds:", error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
        }
        setError("Failed to load leaderboard data.");
        setTotalLeaderboard([]);
        setFunds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedFundId) {
      setFundLeaderboard([]);
      setFundName("");
      return;
    }

    const fetchFundLeaderboard = async () => {
      try {
        const response = await axios.get(`/api/backend/users/leaderboard/fund/${selectedFundId}`);
        console.log(`Fund leaderboard response for ${selectedFundId}:`, response.data);
        setFundLeaderboard(Array.isArray(response.data.leaderboard) ? response.data.leaderboard : []);
        setFundName(response.data.fundName || "Unknown Fund");
      } catch (error) {
        console.error(`Error calling /api/backend/users/leaderboard/fund/${selectedFundId}:`, error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
        }
        setFundLeaderboard([]);
        setFundName("Error Loading Fund");
      }
    };

    fetchFundLeaderboard();
  }, [selectedFundId]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Leaderboard</h1>

      {loading ? (
        <p className="text-gray-600">Loading leaderboards...</p>
      ) : error ? (
        <p className="text-red-500 mb-4">{error}</p>
      ) : (
        <>
          {/* Total SOL Donated Leaderboard */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top 100 Donors (Total SOL)</h2>
            {totalLeaderboard.length === 0 ? (
              <p className="text-gray-600">No donations yet. Be the first to donate!</p>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  {totalLeaderboard.map((user, index) => (
                    <div key={user.walletAddress} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          #{index + 1} {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                        </h3>
                        <p className="text-gray-700">
                          Total Donated:{" "}
                          <span className="font-semibold">{user.totalDonatedSol.toFixed(2)} SOL</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Per-Fund Leaderboard */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Top 100 Donors Per Fund</h2>
            {funds.length === 0 ? (
              <p className="text-gray-600">No active funds available.</p>
            ) : (
              <>
                <select
                  value={selectedFundId || ""}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="block w-full max-w-xs p-2 border rounded mb-4"
                >
                  <option value="" disabled>
                    Select a fund
                  </option>
                  {funds.map((fund) => (
                    <option key={fund._id} value={fund._id}>
                      {fund.name} ({fund.tokenSymbol})
                    </option>
                  ))}
                </select>
                {!selectedFundId ? (
                  <p className="text-gray-600">Please select a fund to view its leaderboard.</p>
                ) : fundLeaderboard.length === 0 ? (
                  <p className="text-gray-600">No donations for {fundName} yet.</p>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    <div className="space-y-4">
                      {fundLeaderboard.map((user, index) => (
                        <div key={user.walletAddress} className="border border-gray-300 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">
                              #{index + 1} {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                            </h3>
                            <p className="text-gray-700">
                              Donated to {fundName}:{" "}
                              <span className="font-semibold">{user.totalForFund.toFixed(2)} SOL</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}