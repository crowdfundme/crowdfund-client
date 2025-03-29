"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../../lib/solana";
import { useRouter, useParams } from "next/navigation";
import { Fund } from "../../../types";

export default function FundDetail() {
  const { id } = useParams();
  const { publicKey } = useWallet();
  const router = useRouter();
  const [fund, setFund] = useState<Fund | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(0.01);
  const [minDonation, setMinDonation] = useState<number>(0.01);
  const [maxDonation, setMaxDonation] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donating, setDonating] = useState<boolean>(false);

  useEffect(() => {
    const fetchFundAndLimits = async () => {
      try {
        setLoading(true);

        const limitsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds/fee`);
        setMinDonation(limitsResponse.data.minDonation);
        setMaxDonation(limitsResponse.data.maxDonation);
        setDonationAmount(limitsResponse.data.minDonation);

        const fundResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=active`);
        const fundData = fundResponse.data.find((f: Fund) => f._id === id);
        if (!fundData) {
          throw new Error("Fund not found or not active");
        }
        setFund(fundData);
      } catch (err) {
        console.error("Failed to fetch fund or limits:", err);
        setError("Failed to load fund details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFundAndLimits();
  }, [id]);

  const handleDonation = async () => {
    if (!publicKey || !fund) return;

    if (donationAmount < minDonation || donationAmount > maxDonation) {
      setError(`Donation amount must be between ${minDonation.toFixed(2)} and ${maxDonation.toFixed(2)} SOL`);
      return;
    }

    try {
      setError(null);
      setDonating(true);

      const connection = getConnection();
      const solBalance = await connection.getBalance(publicKey);
      if (solBalance < 5000) {
        throw new Error("Insufficient SOL for transaction fees. Please add at least 0.01 SOL to your wallet.");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(fund.fundWalletAddress),
          lamports: donationAmount * LAMPORTS_PER_SOL,
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

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fund._id}/donate`, {
        amount: donationAmount,
        donorWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      alert(`Successfully donated ${donationAmount.toFixed(2)} SOL! Transaction signature: ${signature}`);
      router.push("/explore");
    } catch (err: any) {
      console.error("Donation failed:", err);
      const errorMsg = err.message || "Donation failed. Please try again.";
      if (errorMsg.includes("User rejected the request") || (err.code && err.code === 4001)) {
        setError("Transaction canceled. Please try again if you wish to proceed.");
      } else {
        setError(err.response?.data?.error || errorMsg);
      }
    } finally {
      setDonating(false);
    }
  };

  const handleBack = () => {
    router.back(); // Navigate to the previous page in history
  };

  if (loading) {
    return <div className="p-6">Loading fund details...</div>;
  }

  if (error || !fund) {
    return <div className="p-6 text-red-500">{error || "Fund not found."}</div>;
  }

  const progress = Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100);
  const supplyRaisedPercentage = (fund.currentDonatedSol / fund.targetSolAmount) * fund.targetPercentage;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">{fund.name}</h1>
        <button
          onClick={handleBack}
          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
        >
          Back
        </button>
      </div>
      <div className="border border-gray-300 rounded-lg p-4 mb-6">
        <div className="w-full h-48 bg-gray-900 rounded-lg mb-4"></div>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Ticker:</span> {fund.tokenSymbol}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Description:</span> {fund.tokenDescription}
        </p>
        {fund.tokenTwitter && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Twitter:</span>{" "}
            <a href={fund.tokenTwitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Link
            </a>
          </p>
        )}
        {fund.tokenTelegram && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Telegram:</span>{" "}
            <a href={fund.tokenTelegram} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Link
            </a>
          </p>
        )}
        {fund.tokenWebsite && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Website:</span>{" "}
            <a href={fund.tokenWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              Link
            </a>
          </p>
        )}
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Supply Raised:</span>{" "}
          {supplyRaisedPercentage.toFixed(2)}% (Target: {fund.targetPercentage}%)
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Supply Wallet:</span>{" "}
          {fund.fundWalletAddress.slice(0, 4)}...{fund.fundWalletAddress.slice(-4)}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Crowd Wallet:</span>{" "}
          {fund.targetWallet.slice(0, 4)}...{fund.targetWallet.slice(-4)}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Donations:</span>{" "}
          {progress.toFixed(2)}% ({fund.currentDonatedSol.toFixed(2)}/{fund.targetSolAmount.toFixed(2)} SOL)
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-blue-500 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Donate to {fund.name}</h2>
        {publicKey ? (
          <>
            <div className="mb-4">
              <label htmlFor="donation-slider" className="block text-sm font-medium text-gray-700">
                Donation Amount ({minDonation.toFixed(2)} - {maxDonation.toFixed(2)} SOL)
              </label>
              <input
                type="range"
                id="donation-slider"
                min={minDonation}
                max={maxDonation}
                step="0.01"
                value={donationAmount}
                onChange={(e) => setDonationAmount(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="donation-input" className="block text-sm font-medium text-gray-700">
                Enter Amount (SOL)
              </label>
              <input
                type="number"
                id="donation-input"
                min={minDonation}
                max={maxDonation}
                step="0.01"
                value={donationAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setDonationAmount(Math.min(Math.max(value, minDonation), maxDonation));
                  }
                }}
                className="block w-full p-2 border rounded"
              />
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              onClick={handleDonation}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded flex items-center justify-center"
              disabled={!publicKey || donating}
            >
              {donating ? (
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
              {donating ? "Donating..." : `Donate ${donationAmount.toFixed(2)} SOL`}
            </button>
          </>
        ) : (
          <p className="text-gray-600">Please connect your wallet to donate.</p>
        )}
      </div>
    </div>
  );
}