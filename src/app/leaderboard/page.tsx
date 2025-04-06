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

        const totalResponse = await axios.get("/api/backend/users/leaderboard/total");
        console.log("Total leaderboard response:", totalResponse.data);
        setTotalLeaderboard(Array.isArray(totalResponse.data) ? totalResponse.data : []);

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

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-yellow-500 font-bold mr-2">🥇</span>; // Gold
    if (index === 1) return <span className="text-gray-400 font-bold mr-2">🥈</span>; // Silver
    if (index === 2) return <span className="text-amber-600 font-bold mr-2">🥉</span>; // Bronze
    return <span className="text-gray-500 mr-2">#{index + 1}</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Leaderboard</h1>

      {loading ? (
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading leaderboards...</span>
        </div>
      ) : error ? (
        <p className="text-red-500 mb-4 text-center">{error}</p>
      ) : (
        <>
          {/* Total SOL Donated Leaderboard */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Top 100 Donors (Total SOL)</h2>
            {totalLeaderboard.length === 0 ? (
              <p className="text-gray-600 text-center">No donations yet. Be the first to donate!</p>
            ) : (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Donated (SOL)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {totalLeaderboard.map((user, index) => (
                      <tr key={user.walletAddress} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getRankBadge(index)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                          {user.totalDonatedSol.toFixed(2)} SOL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Per-Fund Leaderboard */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Top 100 Donors Per Fund</h2>
            {funds.length === 0 ? (
              <p className="text-gray-600 text-center">No active funds available.</p>
            ) : (
              <>
                <div className="mb-6">
                  <label htmlFor="fund-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Fund
                  </label>
                  <select
                    id="fund-select"
                    value={selectedFundId || ""}
                    onChange={(e) => setSelectedFundId(e.target.value)}
                    className="block w-full max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Choose a fund
                    </option>
                    {funds.map((fund) => (
                      <option key={fund._id} value={fund._id}>
                        {fund.name} ({fund.tokenSymbol})
                      </option>
                    ))}
                  </select>
                </div>
                {!selectedFundId ? (
                  <p className="text-gray-600 text-center">Please select a fund to view its leaderboard.</p>
                ) : fundLeaderboard.length === 0 ? (
                  <p className="text-gray-600 text-center">No donations for {fundName} yet.</p>
                ) : (
                  <div className="bg-white shadow-lg rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Donated (SOL)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fundLeaderboard.map((user, index) => (
                          <tr key={user.walletAddress} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getRankBadge(index)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                              {user.totalForFund.toFixed(2)} SOL
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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