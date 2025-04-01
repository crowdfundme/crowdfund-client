"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../../../lib/solana";
import { useRouter, useParams } from "next/navigation";
import { Fund } from "../../../types";
import Image from "next/image";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { toast, Toaster } from "sonner";
import { logInfo } from "../../../utils/logger";
import { useUser } from "../../../context/UserContext";

export default function FundDetail() {
  const { id } = useParams();
  const { publicKey } = useWallet();
  const router = useRouter();
  const { donating, setDonating } = useUser();
  const [fund, setFund] = useState<Fund | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(0.01);
  const [minDonation, setMinDonation] = useState<number>(0.01);
  const [maxDonation, setMaxDonation] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [launching, setLaunching] = useState<boolean>(false);
  const [isTransferred, setIsTransferred] = useState<boolean>(false);

  useEffect(() => {
    const fetchFundAndLimits = async () => {
      try {
        setLoading(true);
        setError(null);
        logInfo(`Fetching fund details for ID: ${id}`);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const limitsUrl = `${baseUrl}/funds/fee`;
        logInfo("Fetching limits from:", limitsUrl);
        const limitsResponse = await axios.get(limitsUrl);
        setMinDonation(limitsResponse.data.minDonation);
        setMaxDonation(limitsResponse.data.maxDonation);
        setDonationAmount(limitsResponse.data.minDonation);

        const fundUrl = `${baseUrl}/funds/${id}`;
        logInfo("Fetching fund from:", fundUrl);
        const fundResponse = await axios.get(fundUrl);
        const fundData = fundResponse.data;
        setFund(fundData);

        if (fundData.image) {
          try {
            const imageUrl = `${baseUrl}/token-images/${fundData._id}/token-image`;
            logInfo("Fetching image from:", imageUrl);
            const imageResponse = await axios.get(imageUrl);
            if (imageResponse.data.url) {
              setImageUrl(imageResponse.data.url);
            }
          } catch (imgErr) {
            logInfo("Failed to fetch image:", imgErr);
            setImageUrl(null);
          }
        }

        if (fundData.status === "completed" && fundData.tokenAddress) {
          const connection = await getConnection();
          const tokenMint = new PublicKey(fundData.tokenAddress);
          const targetWallet = new PublicKey(fundData.targetWallet);
          const targetTokenAccountAddress = await getAssociatedTokenAddress(tokenMint, targetWallet);
          logInfo("Checking ATA balance for:", targetTokenAccountAddress.toBase58());
          try {
            const balance = await connection.getTokenAccountBalance(targetTokenAccountAddress, "confirmed");
            logInfo("Target wallet balance:", balance.value.uiAmount);
            setIsTransferred((balance.value.uiAmount || 0) > 0);
          } catch (err) {
            logInfo("No tokens transferred yet or ATA not found:", err);
            setIsTransferred(false);
          }
        }
      } catch (err: unknown) {
        logInfo("Fetch error:", err);
        const errorMsg = "Unknown error";
        setError(`Failed to load fund details: ${errorMsg}`);

        try {
          const statuses = ["active", "completed"];
          let found = false;
          for (const status of statuses) {
            logInfo(`Fallback: Attempting to fetch from /funds?status=${status}`);
            const allFundsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=${status}`);
            const foundFund = allFundsResponse.data.find((f: Fund) => f._id === id);
            if (foundFund) {
              logInfo(`Fallback: Found fund in /funds?status=${status}`, foundFund);
              setFund(foundFund);
              setError(null);
              found = true;

              if (foundFund.image) {
                try {
                  const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/token-images/${foundFund._id}/token-image`;
                  logInfo("Fallback: Fetching image from:", imageUrl);
                  const imageResponse = await axios.get(imageUrl);
                  if (imageResponse.data.url) {
                    setImageUrl(imageResponse.data.url);
                  }
                } catch (imgErr) {
                  logInfo("Fallback: Failed to fetch image:", imgErr);
                  setImageUrl(null);
                }
              }

              if (foundFund.status === "completed" && foundFund.tokenAddress) {
                const connection = await getConnection();
                const tokenMint = new PublicKey(foundFund.tokenAddress);
                const targetWallet = new PublicKey(foundFund.targetWallet);
                const targetTokenAccountAddress = await getAssociatedTokenAddress(tokenMint, targetWallet);
                logInfo("Checking ATA balance for:", targetTokenAccountAddress.toBase58());
                try {
                  const balance = await connection.getTokenAccountBalance(targetTokenAccountAddress, "confirmed");
                  logInfo("Target wallet balance:", balance.value.uiAmount);
                  setIsTransferred((balance.value.uiAmount || 0) > 0);
                } catch (err) {
                  logInfo("No tokens transferred yet or ATA not found:", err);
                  setIsTransferred(false);
                }
              }
              break;
            }
          }
          if (!found) {
            logInfo("Fallback failed: Fund not found in active or completed lists");
            toast.error("Fund not found in active or completed lists.");
          }
        } catch (fallbackErr: unknown) {
          logInfo("Fallback fetch failed:", fallbackErr);
          toast.error("Unable to load fund details: " + (fallbackErr || "Unknown error"));
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFundAndLimits();
  }, [id]);

  const handleDonation = async () => {
    if (!publicKey || !fund) {
      const errorMsg = !publicKey ? "Please connect your wallet." : "Fund data not loaded.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (donationAmount < minDonation || donationAmount > maxDonation) {
      const errorMsg = `Donation amount must be between ${minDonation.toFixed(2)} and ${maxDonation.toFixed(2)} SOL`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const fundId = fund._id;
    let isMounted = true;

    try {
      setError(null);
      setDonating(fundId, true);
      logInfo(`Starting donation for fund ${fundId}: ${donationAmount} SOL`);

      const connection = await getConnection();
      const solBalance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL;
      if (solBalance < donationAmount + 0.01) {
        throw new Error(`Insufficient SOL. Need at least ${(donationAmount + 0.01).toFixed(2)} SOL, have ${solBalance.toFixed(2)} SOL`);
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(fund.fundWalletAddress),
          lamports: Math.round(donationAmount * LAMPORTS_PER_SOL),
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
      logInfo(`Donation transaction confirmed: ${signature}`);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fundId}/donate`, {
        amount: donationAmount,
        donorWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      const updatedFund: Fund = response.data;
      logInfo(`Backend response for donation to fund ${fundId}:`, updatedFund);

      if (isMounted) {
        setFund(updatedFund);
        let toastMessage = `Successfully donated ${donationAmount.toFixed(2)} SOL! Tx: ${signature.slice(0, 8)}...`;
        if (updatedFund.status === "completed") {
          toastMessage += ` Fund completed!`;
        }
        toast.success(toastMessage);
        setDonationAmount(minDonation);
      }
    } catch (err: unknown) {
      logInfo("Donation error:", err);
      let errorMsg = "Donation failed.";
      if (err instanceof Error) {
        errorMsg = err.message.includes("User rejected") ? "Transaction cancelled in wallet" : err.message;
      }
      if (axios.isAxiosError(err) && err.response) {
        logInfo("Server error response:", err.response.data);
        errorMsg = err.response.data.error || errorMsg;
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

  const handleManualTransfer = async () => {
    if (!publicKey || !fund || fund.userId.walletAddress !== publicKey.toBase58()) {
      const errorMsg = "Only the fund creator can trigger a manual transfer.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setError(null);
      setTransferring(true);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fund._id}/transfer`, {
        userWallet: publicKey.toBase58(),
      });

      toast.success(response.data.message);
      setIsTransferred(true);
    } catch (err: unknown) {
      logInfo("Transfer error:", err);
      const errorMsg = "Manual transfer failed due to server error.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setTransferring(false);
    }
  };

  const handleManualLaunch = async () => {
    if (!publicKey || !fund || fund.userId.walletAddress !== publicKey.toBase58()) {
      const errorMsg = "Only the fund creator can launch the token.";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setError(null);
      setLaunching(true);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fund._id}/launch`, {
        userWallet: publicKey.toBase58(),
      });

      toast.success(response.data.message);
      setFund({ ...fund, tokenAddress: response.data.tokenAddress });
    } catch (err: unknown) {
      logInfo("Launch error:", err);
      const errorMsg = "Manual token launch failed due to server error.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLaunching(false);
    }
  };

  const handleBack = () => router.push("/explore");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Toaster position="top-right" richColors />
      {loading && <p className="text-gray-600 mb-4">Loading fund details...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {fund ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{fund.name}</h1>
            <button onClick={handleBack} className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded">
              Back to Explore
            </button>
          </div>
          <div className="border border-gray-300 rounded-lg p-4 mb-6">
            {imageUrl ? (
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={imageUrl}
                  alt={fund.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover rounded-lg"
                  onError={() => {
                    logInfo("Image failed to load:", imageUrl);
                    setImageUrl(null);
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500">No Image Available</span>
              </div>
            )}
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
              {(fund.currentDonatedSol / fund.targetSolAmount * fund.targetPercentage).toFixed(2)}% (Target:{" "}
              {fund.targetPercentage}%)
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
              {Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100).toFixed(2)}% (
              {fund.currentDonatedSol.toFixed(2)}/{fund.targetSolAmount.toFixed(2)} SOL)
            </p>
            {fund.status === "completed" && fund.tokenAddress && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Token Address:</span>{" "}
                {fund.tokenAddress.slice(0, 4)}...{fund.tokenAddress.slice(-4)}
              </p>
            )}
            {fund.status === "completed" && fund.launchError && (
              <p className="text-sm text-red-500">
                <span className="font-semibold">Launch Error:</span> {fund.launchError}
              </p>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {fund.status === "active" && (
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
                      disabled={donating[fund._id]}
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
                        if (!isNaN(value)) setDonationAmount(Math.min(Math.max(value, minDonation), maxDonation));
                      }}
                      className="block w-full p-2 border rounded"
                      disabled={donating[fund._id]}
                    />
                  </div>
                  <button
                    onClick={handleDonation}
                    className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!publicKey || donating[fund._id]}
                  >
                    {donating[fund._id] ? (
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
                    {donating[fund._id] ? "Donating..." : `Donate ${donationAmount.toFixed(2)} SOL`}
                  </button>
                </>
              ) : (
                <p className="text-gray-600">Please connect your wallet to donate.</p>
              )}
            </div>
          )}

          {fund.status === "completed" && fund.userId.walletAddress === publicKey?.toBase58() && !fund.tokenAddress && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4">Launch Token</h2>
              <p className="text-gray-600 mb-4">
                The fund is complete but the token has not been created. Click below to manually launch the token.
              </p>
              <button
                onClick={handleManualLaunch}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white p-2 rounded flex items-center justify-center"
                disabled={launching}
              >
                {launching ? (
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
                {launching ? "Launching..." : "Launch Token"}
              </button>
            </div>
          )}

          {fund.status === "completed" && fund.userId.walletAddress === publicKey?.toBase58() && fund.tokenAddress && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4">Manual Token Transfer</h2>
              {isTransferred ? (
                <p className="text-green-500">Tokens have been transferred to the target wallet.</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    The fund is complete. Click below to manually transfer the created token to the target wallet.
                  </p>
                  <button
                    onClick={handleManualTransfer}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center"
                    disabled={transferring}
                  >
                    {transferring ? (
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
                    {transferring ? "Transferring..." : "Transfer Tokens"}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-600">No fund data available yet.</p>
      )}
    </div>
  );
}