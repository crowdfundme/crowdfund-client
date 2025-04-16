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
import { toast } from "sonner";
import { logInfo } from "../../../utils/logger";
import { useUser } from "../../../context/UserContext";

export default function FundDetail() {
  const { id } = useParams();
  const { publicKey } = useWallet();
  const router = useRouter();
  const { donating, setDonating, launchCooldowns, setLaunchCooldown } = useUser();
  const [fund, setFund] = useState<Fund | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(true);
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

  // Copy to clipboard function with type safety
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch((err) => {
      toast.error("Failed to copy!");
      console.error("Copy error:", err);
    });
  };

  useEffect(() => {
    const fetchFundAndLimits = async () => {
      try {
        setLoading(true);
        setError(null);
        setImageLoading(true);
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
          } finally {
            setImageLoading(false);
          }
        } else {
          setImageLoading(false);
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
                } finally {
                  setImageLoading(false);
                }
              } else {
                setImageLoading(false);
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

  const handleManualLaunch = () => {
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

    const cooldown = launchCooldowns[fund._id] || 0;
    if (cooldown > 0) {
      toast.error(`Please wait ${Math.ceil(cooldown / 60)} minute(s) before launching again.`);
      return;
    }

    setError(null);
    setLaunching(true);
    setLaunchCooldown(fund._id, 300); // Set 5-minute cooldown

    axios
      .post(`${baseUrl}/funds/${fund._id}/launch`, {
        userWallet: publicKey.toBase58(),
      })
      .then((response) => {
        logInfo("Launch request accepted:", response.data);
        toast.success(response.data.message || "Launch request sent!");
        // Optional polling for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${baseUrl}/funds/${fund._id}`);
            if (statusRes.data.tokenAddress) {
              setFund({ ...fund, tokenAddress: statusRes.data.tokenAddress });
              clearInterval(pollInterval);
              toast.success("Token launched successfully!");
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }, 5000); // Poll every 5 seconds
      })
      .catch((error) => {
        console.error(`Background error calling ${baseUrl}/funds/${fund._id}/launch:`, error);
        let errorMsg = "Manual token launch failed.";
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
          errorMsg = error.response.data.error || errorMsg;
        }
        logInfo("Launch error:", error);
        toast.error(errorMsg);
      })
      .finally(() => {
        setLaunching(false);
      });

    toast.info("Launch request sent! Processing in the background...");
  };

  const handleBack = () => router.push("/explore");

  const progress = fund
    ? isCompleted
      ? 100
      : Math.min((fund.currentDonatedSol / fund.targetSolAmount) * 100, 100)
    : 0;

  const formatCooldown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 min-h-screen">
      {loading && <p className="text-gray-600 mb-4">Loading fund details...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {fund ? (
        <div className="w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-0" style={{ fontWeight: 300 }}>
              Fund Details
            </h1>
            <button
              onClick={handleBack}
              className="border border-black bg-white text-black px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
            >
              Back
            </button>
          </div>
          <div
            className="bg-white p-4 rounded-lg shadow-md flex flex-col w-full h-[960px] sm:h-[1080px]"
            style={{ border: "0.5px solid black" }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6" style={{ fontWeight: 300 }}>
              {fund.name}
            </h2>
            <div
              className={`w-full h-48 sm:h-[230px] bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden mb-8 ${
                fund.userId.walletAddress === publicKey?.toBase58() && !imageUrl
                  ? "cursor-pointer hover:bg-gray-300 border-2 border-dashed border-gray-300"
                  : "border-none"
              }`}
              onClick={handleImageClick}
            >
              {imageLoading ? (
                <svg
                  className="animate-spin h-8 w-8 text-gray-500"
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
              ) : imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={fund.name}
                  width={672}
                  height={230}
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
                  height={230}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-gray-500 text-sm">
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
            {fund.userId.walletAddress === publicKey?.toBase58() && !imageUrl && imagePreview && (
              <button
                onClick={handleImageUpload}
                className="w-full border border-black bg-white text-black p-2 rounded flex items-center justify-center transition-colors duration-200 hover:bg-black hover:text-white hover:border-white disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed text-sm mt-4 mb-8"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-black"
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
            <div className="flex-1 flex flex-col space-y-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Ticker:</span> {fund.tokenSymbol}
              </p>
              <div>
                <span className="font-semibold">Description:</span>
                <div className="whitespace-pre-wrap">{fund.tokenDescription}</div>
              </div>
              <p>
                <span className="font-semibold">Twitter:</span>{" "}
                {fund.tokenTwitter ? (
                  <a href={fund.tokenTwitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Link
                  </a>
                ) : (
                  ""
                )}
              </p>
              <p>
                <span className="font-semibold">Telegram:</span>{" "}
                {fund.tokenTelegram ? (
                  <a href={fund.tokenTelegram} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Link
                  </a>
                ) : (
                  ""
                )}
              </p>
              <p>
                <span className="font-semibold">Website:</span>{" "}
                {fund.tokenWebsite ? (
                  <a href={fund.tokenWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Link
                  </a>
                ) : (
                  ""
                )}
              </p>
              <p>
                <span className="font-semibold">Supply Raised:</span>{" "}
                {(fund.currentDonatedSol / fund.targetSolAmount * fund.targetPercentage).toFixed(2)}% (Target:{" "}
                {fund.targetPercentage}%)
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-semibold">Supply Wallet:</span>{" "}
                <span>{fund.fundWalletAddress.slice(0, 4)}...{fund.fundWalletAddress.slice(-4)}</span>
                <button
                  onClick={() => copyToClipboard(fund.fundWalletAddress)}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none"
                  title="Copy Supply Wallet Address"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-semibold">Crowd Wallet:</span>{" "}
                <span>{fund.targetWallet.slice(0, 4)}...{fund.targetWallet.slice(-4)}</span>
                <button
                  onClick={() => copyToClipboard(fund.targetWallet)}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none"
                  title="Copy Crowd Wallet Address"
                >
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </p>
              <p>
                <span className="font-semibold">Donations:</span> {progress.toFixed(2)}% (
                {fund.currentDonatedSol.toFixed(2)}/{fund.targetSolAmount.toFixed(2)} SOL)
              </p>
              {fund.status === "completed" && (
                <>
                  <p className="flex items-center space-x-2">
                    <span className="font-semibold">Token Address:</span>{" "}
                    {fund.tokenAddress ? (
                      <>
                        <span>{fund.tokenAddress.slice(0, 4)}...{fund.tokenAddress.slice(-4)}</span>
                        <button
                          onClick={() => fund.tokenAddress && copyToClipboard(fund.tokenAddress)}
                          className="text-blue-500 hover:text-blue-700 focus:outline-none"
                          title="Copy Token Address"
                        >
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </>
                    ) : (
                      "Unknown"
                    )}
                  </p>
                  <p>
                    <span className="font-semibold">Solscan:</span>{" "}
                    {fund.solscanUrl ? (
                      <a href={fund.solscanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Link
                      </a>
                    ) : (
                      "Unknown"
                    )}
                  </p>
                </>
              )}
              {fund.status === "completed" && fund.launchError && (
                <p className="text-sm text-red-500">
                  <span className="font-semibold">Launch Error:</span> {fund.launchError}
                </p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-black h-2 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              {!isCompleted ? (
                publicKey ? (
                  <div className="flex flex-col space-y-4 mt-4">
                    <h2 className="text-lg font-semibold">Donate to {fund.name}</h2>
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
                      className="block w-full p-2 border rounded text-sm"
                      disabled={donating[fund._id]}
                    />
                    <button
                      onClick={handleDonation}
                      className="w-full border border-black bg-white text-black p-2 rounded flex items-center justify-center transition-colors duration-200 hover:bg-black hover:text-white hover:border-white disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed text-sm"
                      disabled={!publicKey || donating[fund._id]}
                    >
                      {donating[fund._id] ? (
                        <svg
                          className="animate-spin h-4 w-4 mr-2 text-black"
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
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm mt-4">Please connect your wallet to donate.</p>
                )
              ) : (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-green-600">Crowdfund Completed</h2>
                  <p className="text-gray-600 text-sm">This crowdfund has reached its target and is no longer accepting donations.</p>
                </div>
              )}
              {fund.status === "completed" && fund.userId.walletAddress === publicKey?.toBase58() && !fund.tokenAddress && (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold">Launch Token</h2>
                  <p className="text-gray-600 text-sm mb-2">
                    The fund is complete but the token has not been created.
                  </p>
                  <button
                    onClick={handleManualLaunch}
                    className="w-full border border-black bg-white text-black p-2 rounded flex items-center justify-center transition-colors duration-200 hover:bg-black hover:text-white hover:border-white disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed text-sm"
                    disabled={launching || !imageUrl || (launchCooldowns[fund._id] || 0) > 0}
                  >
                    {launching ? (
                      <svg
                        className="animate-spin h-4 w-4 mr-2 text-black"
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
                    {launching
                      ? "Launching..."
                      : (launchCooldowns[fund._id] || 0) > 0
                      ? `Cooldown: ${formatCooldown(launchCooldowns[fund._id] || 0)}`
                      : "Launch Token"}
                  </button>
                </div>
              )}
              {fund.status === "completed" && fund.userId.walletAddress === publicKey?.toBase58() && fund.tokenAddress && (
                <div className="mt-4">
                  <h2 className="text-lg font-semibold">Manual Token Transfer</h2>
                  {isTransferred ? (
                    <p className="text-green-500 text-sm">Tokens have been transferred to the target wallet.</p>
                  ) : (
                    <>
                      <p className="text-gray-600 text-sm mb-2">
                        The fund is complete. Click below to manually transfer the created token to the target wallet.
                      </p>
                      <button
                        onClick={handleManualTransfer}
                        className="w-full border border-black bg-white text-black p-2 rounded flex items-center justify-center transition-colors duration-200 hover:bg-black hover:text-white hover:border-white disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed text-sm"
                        disabled={transferring}
                      >
                        {transferring ? (
                          <svg
                            className="animate-spin h-4 w-4 mr-2 text-black"
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
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center">
          <svg
            className="animate-spin h-8 w-8 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      )}
    </div>
  );
}