"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/solana";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast, Toaster } from "sonner";

let renderCount = 0;

export default function CreateFund() {
  renderCount++;
  console.log(`CreateFund: Render count - ${renderCount}`);

  const { publicKey } = useWallet();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    tokenName: "",
    tokenSymbol: "",
    tokenDescription: "",
    targetPercentage: 1,
    targetWallet: "",
    tokenTwitter: "",
    tokenTelegram: "",
    tokenWebsite: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creationFee, setCreationFee] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(true);
  const isMounted = useRef(true);
  const hasFetched = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("CreateFund: useEffect running...");
    isMounted.current = true;

    const fetchFee = async () => {
      if (hasFetched.current) return;

      if (!process.env.NEXT_PUBLIC_API_URL) {
        if (isMounted.current) {
          toast.error("API URL is not configured. Please contact support.");
          setLoadingFee(false);
        }
        return;
      }

      try {
        setLoadingFee(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds/fee`);
        if (isMounted.current) {
          setCreationFee(response.data.creationFee);
          hasFetched.current = true;
        }
      } catch (error) {
        console.error("CreateFund: Failed to fetch creation fee:", error);
        if (isMounted.current) {
          toast.error("Failed to load creation fee. Please try again later.");
          setCreationFee(null);
        }
      } finally {
        if (isMounted.current) setLoadingFee(false);
      }
    };

    fetchFee();

    return () => {
      console.log("CreateFund: Unmounting...");
      isMounted.current = false;
    };
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || creationFee === null) {
      toast.error("Cannot create fund: Creation fee not loaded or wallet not connected.");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload an image for your fund.");
      return;
    }

    try {
      new PublicKey(form.targetWallet);
    } catch (err) {
      toast.error("Invalid target wallet address. Please enter a valid Solana wallet address.");
      return;
    }

    try {
      const connection = getConnection();
      const solBalance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL;
      if (solBalance < creationFee + 0.005) {
        throw new Error(`Insufficient SOL. Please add at least ${creationFee + 0.005} SOL to your wallet.`);
      }

      // Step 1: Create the fund to get fundWalletAddress
      const fundResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds`, {
        ...form,
        userWallet: publicKey.toBase58(),
      });

      const fundId = fundResponse.data._id;
      const fundWalletAddress = new PublicKey(fundResponse.data.fundWalletAddress);

      // Step 2: Send CROWD_FUND_CREATION_FEE to fundWalletAddress
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: fundWalletAddress,
          lamports: creationFee * LAMPORTS_PER_SOL,
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

      // Step 3: Update fund with transaction signature and confirm fee payment
      const updateResponse = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fundId}`, {
        txSignature: signature,
      });

      // Step 4: Upload image
      const formData = new FormData();
      formData.append("image", imageFile);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/token-images/${fundId}/token-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success(`Fund created successfully! Transaction signature: ${signature}`, {
        duration: 3000,
        onAutoClose: () => router.push("/explore"),
      });
      setForm({
        name: "",
        tokenName: "",
        tokenSymbol: "",
        tokenDescription: "",
        targetPercentage: 1,
        targetWallet: "",
        tokenTwitter: "",
        tokenTelegram: "",
        tokenWebsite: "",
      });
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "Failed to create fund.";
      if (errorMsg.includes("User rejected the request") || (error.code && error.code === 4001)) {
        toast.info("Transaction canceled. Please try again if you wish to proceed.", { duration: 5000 });
      } else {
        toast.error(error.response?.data?.error || errorMsg, { duration: 5000 });
      }
    }
  };

  return (
    <div className="mb-8 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <Toaster position="bottom-right" richColors />
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">Start your Crowdfund</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fund Image (Required)</label>
          <div
            className={`w-full h-64 sm:h-72 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-300 ${
              !imagePreview ? "border-2 border-dashed border-gray-300" : "border-none"
            }`}
            onClick={handleImageClick}
          >
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Preview"
                width={672}
                height={256}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-gray-500 text-center px-4">Click to Select Image (Required)</span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fund Name</label>
          <input
            type="text"
            placeholder="Enter fund name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
          <input
            type="text"
            placeholder="Enter token name"
            value={form.tokenName}
            onChange={(e) => setForm({ ...form, tokenName: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
          <input
            type="text"
            placeholder="Enter Ticker"
            value={form.tokenSymbol}
            onChange={(e) => setForm({ ...form, tokenSymbol: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            placeholder="Enter description"
            value={form.tokenDescription}
            onChange={(e) => setForm({ ...form, tokenDescription: e.target.value })}
            className="block w-full p-2 border rounded-md h-32 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Supply % Being Raised</label>
          <select
            value={form.targetPercentage}
            onChange={(e) => setForm({ ...form, targetPercentage: Number(e.target.value) })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={1}>1% (0.3 SOL)</option>
            <option value={5}>5% (1.480938417 SOL)</option>
            <option value={10}>10% (3.114080165 SOL)</option>
            <option value={25}>25% (9.204131229 SOL)</option>
            <option value={50}>50% (26.439790577 SOL)</option>
            <option value={75}>75% (70.356037153 SOL)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Solana Wallet</label>
          <input
            type="text"
            placeholder="Enter Solana Wallet address"
            value={form.targetWallet}
            onChange={(e) => setForm({ ...form, targetWallet: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL (optional)</label>
          <input
            type="text"
            placeholder="Enter Twitter URL"
            value={form.tokenTwitter}
            onChange={(e) => setForm({ ...form, tokenTwitter: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Telegram URL (optional)</label>
          <input
            type="text"
            placeholder="Enter Telegram URL"
            value={form.tokenTelegram}
            onChange={(e) => setForm({ ...form, tokenTelegram: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL (optional)</label>
          <input
            type="text"
            placeholder="Enter website URL"
            value={form.tokenWebsite}
            onChange={(e) => setForm({ ...form, tokenWebsite: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Creation Fee</label>
          <p className="text-gray-500">
            {loadingFee ? "Loading..." : creationFee !== null ? `${creationFee} SOL` : "Unable to load fee"}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md flex items-center justify-center transition-colors duration-200"
          disabled={loadingFee || creationFee === null || !imageFile}
        >
          {loadingFee && (
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
          )}
          {loadingFee
            ? "Loading Fee..."
            : creationFee !== null
            ? `Create Fund (${creationFee} SOL)`
            : "Unable to Load Fee"}
        </button>
      </form>
    </div>
  );
}