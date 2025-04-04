"use client";

import { useEffect, useState, useRef } from "react";
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
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(0.01);
  const [minDonation, setMinDonation] = useState<number>(0.01);
  const [maxDonation, setMaxDonation] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [launching, setLaunching] = useState<boolean>(false);
  const [isTransferred, setIsTransferred] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const baseUrl = "/api/backend";
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchFundAndLimits = async () => {
      try {
        setLoading(true);
        setError(null);
        logInfo(`Fetching fund details for ID: ${id}`);

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

        const statusUrl = `${baseUrl}/funds/${id}/status`;
        logInfo("Fetching fund status from:", statusUrl);
        const statusResponse = await axios.get(statusUrl);
        setIsCompleted(statusResponse.data.isCompleted);

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
        let errorMsg = "Failed to load fund details.";
        if (axios.isAxiosError(err) && err.response) {
          errorMsg = err.response.data.error || errorMsg;
          if (err.response.status === 404) {
            errorMsg = `Fund with ID ${id} not found.`;
          }
        }
        setError(errorMsg);

        try {
          const statuses = ["active", "completed"];
          let found = false;
          for (const status of statuses) {
            logInfo(`Fallback: Attempting to fetch from /funds?status=${status}`);
            const allFundsResponse = await axios.get(`${baseUrl}/funds?status=${status}`);
            const fundsArray = Array.isArray(allFundsResponse.data.funds) ? allFundsResponse.data.funds : [];
            const foundFund = fundsArray.find((f: Fund) => f._id === id);
            if (foundFund) {
              logInfo(`Fallback: Found fund in /funds?status=${status}`, foundFund);
              setFund(foundFund);
              setError(null);
              found = true;

              const statusUrl = `${baseUrl}/funds/${id}/status`;
              const statusResponse = await axios.get(statusUrl);
              setIsCompleted(statusResponse.data.isCompleted);

              if (foundFund.image) {
                try {
                  const imageUrl = `${baseUrl}/token-images/${foundFund._id}/token-image`;
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
          console.error("Error calling /funds in fallback:", fallbackErr);
          if (axios.isAxiosError(fallbackErr) && fallbackErr.response) {
            console.error("Server response:", fallbackErr.response.data);
          }
          logInfo("Fallback fetch failed:", fallbackErr);
          const fallbackErrorMsg = axios.isAxiosError(fallbackErr) && fallbackErr.response
            ? fallbackErr.response.data.error || "Unknown error in fallback fetch"
            : String(fallbackErr);
          toast.error(`Unable to load fund details: ${fallbackErrorMsg}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFundAndLimits();
  }, [id]);

  const handleImageClick = () => {
    if (fund?.userId.walletAddress === publicKey?.toBase58() && !imageUrl) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Image file too large. Maximum size is 25MB.");
        return;
      }
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleImageUpload = async () => {
    if (!publicKey || !fund || fund.userId.walletAddress !== publicKey.toBase58()) {
      toast.error("Only the fund creator can upload an image.");
      return;
    }
    if (!imageFile) {
      toast.error("Please select an image to upload.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      console.log("Uploading image for fund ID:", fund._id);
      console.log("FormData contents:", Array.from(formData.entries()));

      const response = await axios.post(
        `${baseUrl}/token-images/${fund._id}/token-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setImageUrl(response.data.url);
      setFund({ ...fund, image: response.data.tokenImageId });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        const errorMsg = error.response.data.error || "Failed to upload image.";
        if (error.response.status === 400) {
          toast.error("Invalid image file. Please upload a valid image (e.g., JPG, PNG).");
        } else if (error.response.status === 413) {
          toast.error("Image file too large. Maximum size is 25MB.");
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error("Failed to upload image due to an unexpected error.");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!publicKey || !fund || fund.userId.walletAddress !== publicKey.toBase58()) {
      toast.error("Only the fund creator can delete the image.");
      return;
    }

    setUploadingImage(true);
    try {
      await axios.delete(`${baseUrl}/token-images/${fund._id}/token-image`);
      setImageUrl(null);
      setFund({ ...fund, image: undefined });
      toast.success("Image deleted successfully!");
    } catch (error) {
      console.error("Image delete error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        toast.error(error.response.data.error || "Failed to delete image.");
      } else {
        toast.error("Failed to delete image due to an unexpected error.");
      }
    } finally {
      setUploadingImage(false);
    }
  };

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

      // Step 1: Pre-validate donation (HTTP request)
      const preDonateResponse = await axios.post(`${baseUrl}/funds/${fundId}/pre-donate`, {
        amount: donationAmount,
        donorWallet: publicKey.toBase58(),
      });
      const { fundWalletAddress: validatedFundWallet } = preDonateResponse.data;
      logInfo(`Pre-donation validated for fund ${fundId}`);

      const connection = await getConnection();
      const solBalance = (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL;
      if (solBalance < donationAmount + 0.01) {
        throw new Error(`Insufficient SOL. Need at least ${(donationAmount + 0.01).toFixed(2)} SOL, have ${solBalance.toFixed(2)} SOL`);
      }

      // Step 2: Send SOL transaction using signAndSendTransaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(validatedFundWallet),
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

      // Step 3: Notify backend of successful transaction
      const response = await axios.post(`${baseUrl}/funds/${fundId}/donate`, {
        amount: donationAmount,
        donorWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      const updatedFund: Fund = response.data;
      logInfo(`Backend response for donation to fund ${fundId}:`, updatedFund);

      if (isMounted) {
        setFund(updatedFund);
        setIsCompleted(updatedFund.status === "completed");
        let toastMessage = `Successfully donated ${donationAmount.toFixed(2)} SOL! Tx: ${signature.slice(0, 8)}...`;
        if (updatedFund.status === "completed") {
          toastMessage += ` Fund completed!`;
        }
        toast.success(toastMessage);
        setDonationAmount(minDonation);
      }
    } catch (error) {
      console.error(`Error during donation to fund ${fundId}:`, error);
      let errorMsg = "Donation failed.";
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        logInfo("Server error response:", error.response.data);
        errorMsg = error.response.data.error || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message.includes("User rejected") ? "Transaction cancelled in wallet" : error.message;
      }
      logInfo("Donation error:", error);

      if (isMounted) {
        setError(errorMsg);
        toast.error(errorMsg);
        if (errorMsg.includes("Crowdfund is already completed")) {
          setIsCompleted(true);
          setFund((prev) =>
            prev ? { ...prev, status: "completed", currentDonatedSol: prev.targetSolAmount } : prev
          );
        }
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

      const response = await axios.post(`${baseUrl}/funds/${fund._id}/transfer`, {
        userWallet: publicKey.toBase58(),
      });

      toast.success(response.data.message);
      setIsTransferred(true);
    } catch (error) {
      console.error(`Error calling ${baseUrl}/funds/${fund._id}/transfer:`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        const errorMsg = error.response.data.error || "Manual transfer failed due to server error.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        logInfo("Transfer error:", error);
        const errorMsg = "Manual transfer failed due to server error.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
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

    if (!imageUrl) {
      toast.error("An image is required to launch the token on Pump.fun. Please upload an image first.");
      return;
    }

    try {
      setError(null);
      setLaunching(true);

      const response = await axios.post(`${baseUrl}/funds/${fund._id}/launch`, {
        userWallet: publicKey.toBase58(),
      });

      toast.success(response.data.message);
      setFund({ ...fund, tokenAddress: response.data.tokenAddress });
    } catch (error) {
      console.error(`Error calling ${baseUrl}/funds/${fund._id}/launch:`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        const errorMsg = error.response.data.error || "Manual token launch failed due to server error.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        logInfo("Launch error:", error);
        const errorMsg = "Manual token launch failed due to server error.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLaunching(false);
    }
  };

  const handleBack = () => router.push("/explore");

  // Calculate progress, forcing 100% if completed
  const progress = fund
    ? isCompleted
      ? 100
      : Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100)
    : 0;

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
            <div
              className={`w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden ${
                fund.userId.walletAddress === publicKey?.toBase58() && !imageUrl
                  ? "cursor-pointer hover:bg-gray-300 border-2 border-dashed border-gray-300"
                  : "border-none"
              }`}
              onClick={handleImageClick}
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={fund.name}
                  width={672}
                  height={192}
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => {
                    logInfo("Image failed to load:", imageUrl);
                    setImageUrl(null);
                  }}
                />
              ) : imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={672}
                  height={192}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-gray-500">
                  {fund.userId.walletAddress === publicKey?.toBase58()
                    ? "Click to upload an image"
                    : "No Image Available"}
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            {fund.userId.walletAddress === publicKey?.toBase58() && (
              <div className="flex space-x-2 mb-4 mt-2">
                {!imageUrl && imagePreview && (
                  <button
                    onClick={handleImageUpload}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : null}
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </button>
                )}
                {imageUrl && (
                  <button
                    onClick={handleImageDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : null}
                    {uploadingImage ? "Deleting..." : "Delete Image"}
                  </button>
                )}
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
              <span className="font-semibold">Donations:</span> {progress.toFixed(2)}% (
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
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {!isCompleted ? (
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
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-green-600">Crowdfund Completed</h2>
              <p className="text-gray-600">This crowdfund has reached its target and is no longer accepting donations.</p>
            </div>
          )}

          {fund.status === "completed" && fund.userId.walletAddress === publicKey?.toBase58() && !fund.tokenAddress && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-xl font-semibold mb-4">Launch Token</h2>
              <p className="text-gray-600 mb-4">
                The fund is complete but the token has not been created.
              </p>
              <button
                onClick={handleManualLaunch}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white p-2 rounded flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={launching || !imageUrl}
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
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
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