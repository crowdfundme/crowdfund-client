"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

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

export default function Profile() {
  const { walletAddress } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "donations">("info");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${walletAddress}`);
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchProfile();
    }
  }, [walletAddress]);

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-6 text-red-500">Profile not found.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Profile: {profile.walletAddress.slice(0, 4)}...{profile.walletAddress.slice(-4)}
      </h1>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab("info")}
          className={`p-2 flex-1 text-center ${activeTab === "info" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-600"}`}
        >
          User Info
        </button>
        <button
          onClick={() => setActiveTab("donations")}
          className={`p-2 flex-1 text-center ${activeTab === "donations" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-600"}`}
        >
          Donation History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Wallet Address:</span> {profile.walletAddress}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Name:</span> {profile.name || "Not set"}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Email:</span> {profile.email || "Not set"}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Total Donated:</span>{" "}
            {profile.totalDonatedSol.toFixed(2)} SOL
          </p>
        </div>
      )}

      {activeTab === "donations" && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Donation History</h2>
          <p className="text-gray-700 mb-4">
            Total Donated: <span className="font-semibold">{profile.totalDonatedSol.toFixed(2)} SOL</span>
          </p>
          {profile.donations.length === 0 ? (
            <p className="text-gray-600">No donations recorded.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <ul className="space-y-2">
                {profile.donations.map((donation, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    Donated {donation.amount.toFixed(2)} SOL to {donation.fundId.name} (
                    {donation.fundId.tokenSymbol}) on {new Date(donation.donatedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}