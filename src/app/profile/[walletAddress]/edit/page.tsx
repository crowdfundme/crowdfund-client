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
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
          />
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Save Changes
          </button>
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>
        {message && <p className="mt-2 text-green-500">{message}</p>}
      </form>
    </div>
  );
}