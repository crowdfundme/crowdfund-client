"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

interface Donation {
  fundId: { name: string; tokenSymbol: string };
  amount: number;
  donatedAt: string;
}

interface UserProfile {
  walletAddress: string;
  name: string | null;
  email: string | null;
  totalDonatedSol: number;
  donations: Donation[];
}

export default function UserProfile() {
  const { publicKey } = useWallet();
  const { walletAddress } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "donations">("info");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/backend/users/${walletAddress}`);
        setProfile(response.data);
      } catch (error) {
        console.error(`Error calling /api/backend/users/${walletAddress}:`, error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchProfile();
    }
  }, [walletAddress]);

  const handleUpdateClick = () => {
    router.push(`/profile/${walletAddress}/edit`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center space-x-2 text-gray-600">
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 text-lg font-medium">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
        Profile: {profile.walletAddress.slice(0, 4)}...{profile.walletAddress.slice(-4)}
      </h1>

      {/* Tabs */}
      <div className="flex border-b mb-6 bg-white rounded-t-lg shadow-sm">
        <button
          onClick={() => setActiveTab("info")}
          className={`p-4 flex-1 text-center text-lg font-medium transition-colors duration-200 ${
            activeTab === "info"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-400"
          }`}
        >
          User Info
        </button>
        <button
          onClick={() => setActiveTab("donations")}
          className={`p-4 flex-1 text-center text-lg font-medium transition-colors duration-200 ${
            activeTab === "donations"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-600 hover:text-blue-400"
          }`}
        >
          Donation History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <p className="text-gray-700 text-lg">
              <span className="font-semibold">Wallet Address:</span> {profile.walletAddress}
            </p>
            <p className="text-gray-700 text-lg">
              <span className="font-semibold">Name:</span> {profile.name || "Not set"}
            </p>
            <p className="text-gray-700 text-lg">
              <span className="font-semibold">Email:</span> {profile.email || "Not set"}
            </p>
            {publicKey && publicKey.toBase58() === walletAddress && (
              <button
                onClick={handleUpdateClick}
                className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                Update Profile
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "donations" && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Donation History</h2>
          <p className="text-gray-700 mb-6 text-lg">
            Total Donated: <span className="font-semibold text-blue-600">{profile.totalDonatedSol.toFixed(2)} SOL</span>
          </p>
          {profile.donations.length === 0 ? (
            <p className="text-gray-600 text-center">No donations recorded.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto rounded-md border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (SOL)</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profile.donations.map((donation, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {donation.fundId.name} ({donation.fundId.tokenSymbol})
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                        {donation.amount.toFixed(2)} SOL
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">
                        {new Date(donation.donatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}