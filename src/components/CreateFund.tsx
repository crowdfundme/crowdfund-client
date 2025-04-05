"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/solana";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast, Toaster } from "sonner";

export default function CreateFund() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [form, setForm] = useState<{
    name: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDescription: string;
    targetPercentage: number;
    targetWallet: string;
    tokenTwitter: string;
    tokenTelegram: string;
    tokenWebsite: string;
  }>({
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
  const [creationFee, setCreationFee] = useState<number>(0.1); // Default to 0.1 SOL
  const [loadingFee, setLoadingFee] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const isMounted = useRef<boolean>(true);
  const hasFetched = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("CreateFund: useEffect running...");
    isMounted.current = true;

    const fetchFee = async () => {
      if (hasFetched.current) return;

      try {
        setLoadingFee(true);
        const response = await axios.get("/api/backend/funds/fee", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });
        if (isMounted.current) {
          setCreationFee(response.data.creationFee || 0.1);
          hasFetched.current = true;
        }
      } catch (error) {
        console.error("Error calling /api/backend/funds/fee:", error);
        if (axios.isAxiosError(error) && error.response) {
          console.error("Server response:", error.response.data);
        }
        if (isMounted.current) {
          toast.error("Failed to load creation fee. Using default 0.1 SOL.");
          setCreationFee(0.1);
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
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!publicKey) {
      toast.error("Wallet not connected. Please connect your wallet.");
      return;
    }
  
    if (!imageFile) {
      toast.error("Image is required. Please upload an image for your fund.");
      return;
    }
  
    setCreating(true);
  
    // Validate target wallet
    console.log("[handleSubmit] Validating targetWallet:", form.targetWallet);
    if (!form.targetWallet || form.targetWallet.trim() === "") {
      setCreating(false);
      toast.error("Target wallet address is required.");
      return;
    }
    try {
      new PublicKey(form.targetWallet);
    } catch (err) {
      setCreating(false);
      console.error("[handleSubmit] Invalid targetWallet:", err);
      toast.error("Invalid target wallet address. Please enter a valid Solana public key.");
      return;
    }
  
    try {
      const connection = await getConnection();
      const solBalance = (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL;
      if (solBalance < creationFee + 0.005) {
        throw new Error(`Insufficient SOL. Please add at least ${creationFee + 0.005} SOL to your wallet.`);
      }
  
      // Step 1: Send SOL to WEBSITE_WALLET
      console.log("[handleSubmit] WEBSITE_WALLET:", process.env.NEXT_PUBLIC_WEBSITE_WALLET);
      const websiteWalletKey = process.env.NEXT_PUBLIC_WEBSITE_WALLET;
      if (!websiteWalletKey) {
        throw new Error("Website wallet address is not configured in the environment.");
      }
      let websiteWallet: PublicKey;
      try {
        websiteWallet = new PublicKey(websiteWalletKey);
        if (!PublicKey.isOnCurve(websiteWallet)) {
          throw new Error("Website wallet address is not a valid Solana public key.");
        }
      } catch (err) {
        throw new Error(`Invalid website wallet address in environment: ${err}`);
      }
  
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: websiteWallet,
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
  
      // Step 2: Create the fund with the transaction signature
      const fundResponse = await axios.post("/api/backend/funds", {
        ...form,
        userWallet: publicKey.toBase58(),
        txSignature: signature,
      });
  
      const fundId = fundResponse.data._id;
  
      // Step 3: Upload the image
      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        await axios.post(`/api/backend/token-images/${fundId}/token-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (imageError) {
        if (axios.isAxiosError(imageError) && imageError.response?.status === 400) {
          toast.error("Invalid image file. Please upload a valid image (e.g., JPG, PNG). Fund created, but image upload failed.");
          // Continue despite image failure
        } else {
          throw imageError; // Rethrow other errors (e.g., 500)
        }
      }
  
      toast.success(`Fund created successfully! ${fundResponse.data.message}`, {
        duration: 3000,
        onAutoClose: () => router.push("/explore"),
      });
  
      // Reset form
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error in fund creation:", error);
      let errorMsg = "Failed to create fund.";
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        errorMsg = error.response.data.error || errorMsg; // Extract string error message
      } else if (error instanceof Error) {
        errorMsg = error.message;
        const isRejected =
          error.message.includes("User rejected") ||
          (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 4001);
        if (isRejected) {
          toast.info("Transaction canceled. Please try again if you wish to proceed.", { duration: 5000 });
          setCreating(false);
          return;
        }
      }
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-8 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <Toaster position="bottom-right" richColors />
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">Start your Crowdfund</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token Image <span className="text-red-500">*</span>
          </label>
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
              <span className="text-gray-500 text-center px-4">Click to Select Image</span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
          />
          {!imageFile && (
            <p className="text-red-500 text-sm mt-1">An image is required to create your fund.</p>
          )}
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
            type="url"
            placeholder="Enter Twitter URL"
            value={form.tokenTwitter}
            onChange={(e) => setForm({ ...form, tokenTwitter: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Telegram URL (optional)</label>
          <input
            type="url"
            placeholder="Enter Telegram URL"
            value={form.tokenTelegram}
            onChange={(e) => setForm({ ...form, tokenTelegram: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL (optional)</label>
          <input
            type="url"
            placeholder="Enter website URL"
            value={form.tokenWebsite}
            onChange={(e) => setForm({ ...form, tokenWebsite: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Creation Fee</label>
          <p className="text-gray-500">
            {loadingFee ? "Loading..." : `${creationFee.toFixed(2)} SOL`}
          </p>
        </div>

        <button
          type="submit"
          disabled={!publicKey || creating || loadingFee || !imageFile}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
        >
          {creating ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating Fund...
            </>
          ) : loadingFee ? (
            "Loading Fee..."
          ) : (
            `Create Fund (${creationFee.toFixed(2)} SOL)`
          )}
        </button>
      </form>
    </div>
  );
}