"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Fund } from "../../types";

interface TotalDonatedUser {
  walletAddress: string;
  totalDonatedSol: number;
}

interface FundLeaderboardUser {
  walletAddress: string;
  totalForFund: number;
}

export default function Leaderboard() {
  const [totalLeaderboard, setTotalLeaderboard] = useState<TotalDonatedUser[]>([]);
  const [fundLeaderboard, setFundLeaderboard] = useState<FundLeaderboardUser[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [fundName, setFundName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const totalResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/leaderboard/total`);
        setTotalLeaderboard(totalResponse.data);

        const fundsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=active`);
        setFunds(fundsResponse.data);
        if (fundsResponse.data.length > 0) {
          setSelectedFundId(fundsResponse.data[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedFundId) return;

    const fetchFundLeaderboard = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/leaderboard/fund/${selectedFundId}`
        );
        setFundLeaderboard(response.data.leaderboard);
        setFundName(response.data.fundName);
      } catch (error) {
        console.error(`Failed to fetch leaderboard for fund ${selectedFundId}:`, error);
        setFundLeaderboard([]);
      }
    };

    fetchFundLeaderboard();
  }, [selectedFundId]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Leaderboard</h1>

      {loading ? (
        <p className="text-gray-600">Loading leaderboards...</p>
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
            <select
              value={selectedFundId || ""}
              onChange={(e) => setSelectedFundId(e.target.value)}
              className="block w-full max-w-xs p-2 border rounded mb-4"
            >
              {funds.map((fund) => (
                <option key={fund._id} value={fund._id}>
                  {fund.name} ({fund.tokenSymbol})
                </option>
              ))}
            </select>
            {fundLeaderboard.length === 0 ? (
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
          </div>
        </>
      )}
    </div>
  );
}