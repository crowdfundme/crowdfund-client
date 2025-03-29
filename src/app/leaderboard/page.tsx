"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Donation {
  fundId: { name: string; tokenSymbol: string };
  amount: number;
  donatedAt: string;
}

interface LeaderboardUser {
  walletAddress: string;
  totalDonatedSol: number;
  donations: Donation[];
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/leaderboard`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Leaderboard</h1>
      {loading ? (
        <p className="text-gray-600">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <p className="text-gray-600">No donations yet. Be the first to donate!</p>
      ) : (
        <div className="space-y-6">
          {leaderboard.map((user, index) => (
            <div key={user.walletAddress} className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">
                  #{index + 1} {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
                </h2>
                <p className="text-gray-700">
                  Total Donated: <span className="font-semibold">{user.totalDonatedSol} SOL</span>
                </p>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Donation History</h3>
              {user.donations.length === 0 ? (
                <p className="text-gray-600 text-sm">No donations recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {user.donations.map((donation, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      Donated {donation.amount} SOL to {donation.fundId.name} ({donation.fundId.tokenSymbol}) on{" "}
                      {new Date(donation.donatedAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}