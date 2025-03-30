"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/solana";
import Image from "next/image";
import { Fund } from "../types";
import axios from "axios";
import Link from "next/link";

interface FundListProps {
  funds: Fund[];
  status: "active" | "completed";
  onDonationSuccess?: () => void;
}

export default function FundList({ funds, status, onDonationSuccess }: FundListProps) {
  const { publicKey } = useWallet();
  const [donationAmounts, setDonationAmounts] = useState<{ [key: string]: number }>({});
  const [minDonation, setMinDonation] = useState<number>(0.01);
  const [maxDonation, setMaxDonation] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [donating, setDonating] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({}); // Store image URLs

  useEffect(() => {
    const fetchLimitsAndImages = async () => {
      try {
        const limitsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds/fee`);
        setMinDonation(limitsResponse.data.minDonation);
        setMaxDonation(limitsResponse.data.maxDonation);

        const initialAmounts = funds.reduce((acc: { [key: string]: number }, fund: Fund) => {
          acc[fund._id] = limitsResponse.data.minDonation;
          return acc;
        }, {});
        setDonationAmounts(initialAmounts);

        // Fetch image URLs for each fund
        const imagePromises = funds.map((fund) =>
          fund.image
            ? axios.get(`${process.env.NEXT_PUBLIC_API_URL}/token-images/${fund._id}/token-image`)
            : Promise.resolve(null)
        );
        const imageResponses = await Promise.all(imagePromises);
        const urls = imageResponses.reduce((acc: { [key: string]: string }, res, idx) => {
          if (res && res.data.url) {
            acc[funds[idx]._id] = res.data.url;
          }
          return acc;
        }, {});
        setImageUrls(urls);
      } catch (err) {
        console.error("Failed to fetch donation limits or images:", err);
        setError("Failed to load donation limits or images. Using defaults.");
      }
    };

    fetchLimitsAndImages();
  }, [funds]);

  const handleDonation = async (fundId: string, fundWalletAddress: string) => {
    if (!publicKey) {
      setError("Please connect your wallet to donate.");
      return;
    }

    const amount = donationAmounts[fundId];
    if (!amount || amount < minDonation || amount > maxDonation) {
      setError(`Donation amount for fund ${fundId} must be between ${minDonation} and ${maxDonation} SOL`);
      return;
    }

    try {
      setError(null);
      setDonating(fundId);

      const connection = getConnection();
      const solBalance = await connection.getBalance(publicKey);
      if (solBalance < 5000) {
        throw new Error("Insufficient SOL for transaction fees. Please add at least 0.01 SOL to your wallet.");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(fundWalletAddress),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const provider = window.solana;
      if (!provider || !provider.isPhantom) {
        throw new Error("Phantom wallet not detected.");
      }

      const { signature } = await provider.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature, "confirmed");

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fundId}/donate`, {
        amount,
        donorWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      alert(`Successfully donated ${amount.toFixed(2)} SOL! Transaction signature: ${signature}`);

      if (onDonationSuccess) {
        onDonationSuccess();
      }
    } catch (err: any) {
      console.error("Donation failed:", err);
      const errorMsg = err.message || "Donation failed. Please try again.";
      if (errorMsg.includes("User rejected the request") || (err.code && err.code === 4001)) {
        setError("Transaction canceled. Please try again if you wish to proceed.");
      } else {
        setError(err.response?.data?.error || errorMsg);
      }
    } finally {
      setDonating(null);
    }
  };

  if (funds.length === 0) {
    return null;
  }

  return (
    <div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {funds.map((fund) => {
          const progress = Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100);
          const imageUrl = imageUrls[fund._id];

          return (
            <div key={fund._id} className="bg-white p-4 rounded-lg shadow-md">
              <Link href={`/fund/${fund._id}`}>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{fund.name}</h2>
              </Link>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={fund.name}
                  width={300}
                  height={150}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500">No Image Available</span>
                </div>
              )}
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Token:</span> {fund.tokenName} ({fund.tokenSymbol})
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Progress:</span> {progress.toFixed(2)}% (
                {fund.currentDonatedSol.toFixed(2)}/{fund.targetSolAmount.toFixed(2)} SOL)
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {status === "active" && publicKey ? (
                <>
                  <div className="mb-4">
                    <label htmlFor={`donation-${fund._id}`} className="block text-sm font-medium text-gray-700">
                      Donation Amount ({minDonation.toFixed(2)} - {maxDonation.toFixed(2)} SOL)
                    </label>
                    <input
                      type="number"
                      id={`donation-${fund._id}`}
                      min={minDonation}
                      max={maxDonation}
                      step="0.01"
                      value={donationAmounts[fund._id] || minDonation}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setDonationAmounts((prev) => ({
                            ...prev,
                            [fund._id]: Math.min(Math.max(value, minDonation), maxDonation),
                          }));
                        }
                      }}
                      className="block w-full p-2 border rounded mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDonation(fund._id, fund.fundWalletAddress)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white p-2 rounded flex items-center justify-center"
                      disabled={!publicKey || donating === fund._id}
                    >
                      {donating === fund._id ? (
                        <svg
                          className="animate-spin h-5 w-5 mr-2 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          ></path>
                        </svg>
                      ) : null}
                      {donating === fund._id
                        ? "Donating..."
                        : `Donate ${(donationAmounts[fund._id] || minDonation).toFixed(2)} SOL`}
                    </button>
                    <Link href={`/fund/${fund._id}`} className="flex-1">
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
                        View
                      </button>
                    </Link>
                  </div>
                </>
              ) : status === "active" ? (
                <div className="flex gap-2">
                  <p className="flex-1 text-gray-600">Connect wallet to donate</p>
                  <Link href={`/fund/${fund._id}`} className="flex-1">
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
                      View
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <p className="flex-1 text-green-500">
                    Completed! Token launched at: {fund.tokenAddress}
                  </p>
                  <Link href={`/fund/${fund._id}`} className="flex-1">
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
                      View
                    </button>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}