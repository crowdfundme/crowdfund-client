"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

interface UserProfile {
  walletAddress: string;
  name: string | null;
  email: string | null;
  totalDonatedSol: number;
  donations: any[];
}

export default function UserProfileEdit() {
  const { publicKey } = useWallet();
  const { walletAddress } = useParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || publicKey.toBase58() !== walletAddress) {
      router.push(`/profile/${walletAddress}`);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/api/backend/users/${walletAddress}`);
        setName(response.data.name || "");
        setEmail(response.data.email || "");
      } catch (error) {
        console.error(`Error calling /api/backend/users/${walletAddress}:`, error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
        }
        setMessage("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [publicKey, walletAddress, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setMessage("Please connect your wallet.");
      return;
    }

    try {
      const response = await axios.put(`/api/backend/users/update/${walletAddress}`, { name, email });
      setMessage("Profile updated successfully!");
      setTimeout(() => router.push(`/profile/${walletAddress}`), 1500);
    } catch (error) {
      console.error(`Error calling /api/backend/users/update/${walletAddress}:`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        setMessage(error.response.data.error || "Failed to update profile.");
      } else {
        setMessage("Error updating profile.");
      }
    }
  };

  const handleBack = () => {
    router.push(`/profile/${walletAddress}`);
  };

  if (!publicKey || publicKey.toBase58() !== walletAddress) return null;
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
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              placeholder="Enter your email"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors duration-200"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600 transition-colors duration-200"
            >
              Back
            </button>
          </div>
        </div>
        {message && (
          <p
            className={`mt-4 text-center text-lg font-medium ${
              message.includes("success") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}