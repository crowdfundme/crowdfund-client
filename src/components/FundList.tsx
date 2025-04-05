"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/solana";
import Image from "next/image";
import { Fund } from "../types";
import axios from "axios";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { logInfo } from "../utils/logger";
import { useUser } from "../context/UserContext";

interface FundListProps {
  funds: Fund[];
  status: "active" | "completed" | "mixed"; // Add "mixed"
  onDonationSuccess?: (updatedFund?: Fund) => void;
}

export default function FundList({ funds, status, onDonationSuccess }: FundListProps) {
  const { publicKey } = useWallet();
  const { donating, setDonating } = useUser();
  const [donationAmounts, setDonationAmounts] = useState<{ [key: string]: number }>({});
  const [minDonation, setMinDonation] = useState<number>(0.01);
  const [maxDonation, setMaxDonation] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchLimitsAndImages = async () => {
      try {
        const limitsResponse = await axios.get("/api/backend/funds/fee");
        setMinDonation(limitsResponse.data.minDonation);
        setMaxDonation(limitsResponse.data.maxDonation);

        const initialAmounts = funds.reduce((acc: { [key: string]: number }, fund: Fund) => {
          acc[fund._id] = limitsResponse.data.minDonation;
          return acc;
        }, {});
        setDonationAmounts(initialAmounts);

        const imagePromises = funds.map((fund) =>
          fund.image
            ? axios.get(`/api/backend/token-images/${fund._id}/token-image`)
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
      } catch (error) {
        console.error("Error calling /api/backend/funds/fee or /token-images:", error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
        }
        const errorMsg = "Failed to load donation limits or images. Using defaults.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    };

    fetchLimitsAndImages();
  }, [funds]);

  const handleDonation = async (fundId: string, fundWalletAddress: string) => {
    if (!publicKey) {
      const errorMsg = "Please connect your wallet to donate.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const amount = donationAmounts[fundId];
    if (!amount || amount < minDonation || amount > maxDonation) {
      const errorMsg = `Donation amount must be between ${minDonation} and ${maxDonation} SOL`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    let isMounted = true;

    try {
      setError(null);
      setDonating(fundId, true);
      logInfo(`Starting donation for fund ${fundId}: ${amount} SOL`);

      const connection = await getConnection();
      const solBalance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL;
      if (solBalance < amount + 0.01) {
        throw new Error(`Insufficient SOL. Need at least ${(amount + 0.01).toFixed(2)} SOL, have ${solBalance.toFixed(2)} SOL`);
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(fundWalletAddress),
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const provider = window.solana;
      if (!provider || !provider.signAndSendTransaction) {
        throw new Error("Wallet not detected or incompatible. Please use a Solana-compatible wallet (e.g., Phantom).");
      }

      toast.info("Please confirm the transaction in your wallet...");
      const { signature } = await provider.signAndSendTransaction(transaction);
      toast.info("Transaction sent, awaiting confirmation...");

      const confirmationPromise = connection.confirmTransaction(signature, "confirmed");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Transaction confirmation timed out after 60 seconds")), 60000)
      );
      await Promise.race([confirmationPromise, timeoutPromise]);
      logInfo(`Transaction confirmed: ${signature}`);

      const response = await axios.post(`/api/backend/funds/${fundId}/donate`, {
        amount,
        donorWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      const updatedFund: Fund = response.data;
      logInfo(`Backend response for donation to fund ${fundId}:`, updatedFund);

      if (isMounted) {
        let toastMessage = `Successfully donated ${amount.toFixed(2)} SOL! Transaction: ${signature.slice(0, 8)}...`;
        if (updatedFund.status === "completed") {
          toastMessage += ` Fund completed! Token: ${updatedFund.tokenAddress?.slice(0, 4)}...${updatedFund.tokenAddress?.slice(-4)}`;
        }
        toast.success(toastMessage);

        if (onDonationSuccess) {
          onDonationSuccess(updatedFund);
        }
      }
    } catch (error) {
      console.error(`Error calling /api/backend/funds/${fundId}/donate:`, error);
      let errorMsg = "Donation failed.";
      
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        logInfo("Server error response:", error.response.data);
        errorMsg = error.response.data.error || error.response.data.message || "Unknown error";
      }
      logInfo("Donation error:", error);      
      if (error instanceof Error) {
        errorMsg = error.message.includes("User rejected") ? "Transaction cancelled in wallet" : error.message;
      }
      if (isMounted) {
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      if (isMounted) {
        setDonating(fundId, false);
        logInfo(`Donation process completed for fund ${fundId}`);
      }
    }

    return () => {
      isMounted = false;
    };
  };

  return (
    <div>
      <Toaster position="top-right" richColors />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {funds.map((fund) => {
          const progress = Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100);
          const imageUrl = imageUrls[fund._id];
          const fundStatus = status === "mixed" ? fund.status : status; // Use fund.status when status is "mixed"

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
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              {fundStatus === "active" && publicKey ? (
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
                      disabled={donating[fund._id]}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDonation(fund._id, fund.fundWalletAddress)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white p-2 rounded flex items-center justify-center transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={!publicKey || donating[fund._id]}
                    >
                      {donating[fund._id] ? (
                        <>
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
                          Donating...
                        </>
                      ) : (
                        `Donate ${(donationAmounts[fund._id] || minDonation).toFixed(2)} SOL`
                      )}
                    </button>
                    <Link href={`/fund/${fund._id}`} className="flex-1">
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">View</button>
                    </Link>
                  </div>
                </>
              ) : fundStatus === "active" ? (
                <div className="flex gap-2">
                  <p className="flex-1 text-gray-600">Connect wallet to donate</p>
                  <Link href={`/fund/${fund._id}`} className="flex-1">
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">View</button>
                  </Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <p className="flex-1 text-green-500">
                    Completed! Token:{" "}
                    {fund.tokenAddress
                      ? `${fund.tokenAddress.slice(0, 4)}...${fund.tokenAddress.slice(-4)}`
                      : "Not yet launched"}
                  </p>
                  <Link href={`/fund/${fund._id}`} className="flex-1">
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">View</button>
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