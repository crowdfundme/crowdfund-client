"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, ComputeBudgetProgram } from "@solana/web3.js";
import { getConnection } from "../lib/solana";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

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
    targetPercentage: 5,
    targetWallet: "",
    tokenTwitter: "",
    tokenTelegram: "",
    tokenWebsite: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creationFee, setCreationFee] = useState<number>(0.1);
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

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validTickerRegex = /^[a-zA-Z0-9]*$/;
    if (value.length > 12) {
      toast.error("Ticker must be 12 characters or fewer.");
      return;
    }
    if (!validTickerRegex.test(value)) {
      toast.error("Ticker must contain only letters and numbers (no spaces or special characters).");
      return;
    }
    setForm({ ...form, tokenSymbol: value }); // Removed .toUpperCase()
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 150) {
      setForm({ ...form, tokenDescription: value });
    } else {
      toast.error("Description must be 150 characters or fewer.");
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

    if (!form.tokenSymbol || form.tokenSymbol.length > 12 || !/^[a-zA-Z0-9]*$/.test(form.tokenSymbol)) {
      toast.error("Ticker must be 1-12 alphanumeric characters with no spaces or special characters.");
      return;
    }

    setCreating(true);

    try {
      const connection = await getConnection();
      const solBalance = (await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL;
      const gasReserve = 0.005;
      if (solBalance < creationFee + gasReserve) {
        throw new Error(`Insufficient SOL. Please add at least ${(creationFee + gasReserve).toFixed(3)} SOL to your wallet.`);
      }

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

      const transaction = new Transaction();
      const priorityFeeMicroLamports = 10000;
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFeeMicroLamports,
        })
      );
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: websiteWallet,
          lamports: Math.round(creationFee * LAMPORTS_PER_SOL),
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const provider = window.solana;
      if (!provider || !provider.signAndSendTransaction) {
        throw new Error("Solana wallet (e.g., Phantom) not detected.");
      }

      toast.info("Please confirm the transaction in your wallet...");
      const { signature } = await provider.signAndSendTransaction(transaction);
      toast.info("Transaction sent, awaiting confirmation...");

      const confirmationPromise = connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Transaction confirmation timed out after 60 seconds")), 60000)
      );
      await Promise.race([confirmationPromise, timeoutPromise]);
      console.log("[handleSubmit] Transaction confirmed:", signature);

      const fundResponse = await axios.post("/api/backend/funds", {
        ...form,
        userWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      const fundId = fundResponse.data._id;

      const formData = new FormData();
      formData.append("image", imageFile);
      try {
        await axios.post(`/api/backend/token-images/${fundId}/token-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (imageError) {
        if (axios.isAxiosError(imageError) && imageError.response?.status === 400) {
          toast.error("Invalid image file. Fund created, but image upload failed.", { duration: 5000 });
        } else {
          throw imageError;
        }
      }

      toast.success(`Fund created successfully! ${fundResponse.data.message}`, {
        duration: 3000,
        onAutoClose: () => router.push("/explore"),
      });

      setForm({
        name: "",
        tokenName: "",
        tokenSymbol: "",
        tokenDescription: "",
        targetPercentage: 5,
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
      let refundSignature: string | undefined;

      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data);
        errorMsg = error.response.data.error || errorMsg;
        refundSignature = error.response.data.refundSignature;
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

      const fullMessage = refundSignature
        ? `${errorMsg} ${
            refundSignature.includes("failed")
              ? "Refund attempted but failed. Please contact support."
              : `Refunded: ${refundSignature}`
          }`
        : errorMsg;

      toast.error(fullMessage, { duration: 5000 });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-8 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center" style={{ fontWeight: 300 }}>
        Start your Crowdfund
      </h1>
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
            placeholder="enter fund name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
          <input
            type="text"
            placeholder="enter token name"
            value={form.tokenName}
            onChange={(e) => setForm({ ...form, tokenName: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
          <input
            type="text"
            placeholder="enter ticker"
            value={form.tokenSymbol}
            onChange={handleTickerChange}
            maxLength={12}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
            required
          />
          <p className="text-gray-500 text-sm mt-1">Max 12 characters, letters and numbers only (e.g., SOL, BTC).</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            placeholder="enter description"
            value={form.tokenDescription}
            onChange={handleDescriptionChange}
            maxLength={150}
            className="block w-full p-2 border rounded-md h-32 resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
            required
          />
          <p className="text-gray-500 text-sm mt-1">
            {form.tokenDescription.length}/150 characters
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Supply % Being Raised</label>
          <select
            value={form.targetPercentage}
            onChange={(e) => setForm({ ...form, targetPercentage: Number(e.target.value) })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
          >
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={75}>75%</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Solana Wallet</label>
          <input
            type="text"
            placeholder="enter Solana wallet address"
            value={form.targetWallet}
            onChange={(e) => setForm({ ...form, targetWallet: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL (optional)</label>
          <input
            type="url"
            placeholder="enter Twitter URL"
            value={form.tokenTwitter}
            onChange={(e) => setForm({ ...form, tokenTwitter: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Telegram URL (optional)</label>
          <input
            type="url"
            placeholder="enter Telegram URL"
            value={form.tokenTelegram}
            onChange={(e) => setForm({ ...form, tokenTelegram: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL (optional)</label>
          <input
            type="url"
            placeholder="enter website URL"
            value={form.tokenWebsite}
            onChange={(e) => setForm({ ...form, tokenWebsite: e.target.value })}
            className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-[#1a1a1a]"
          />
        </div>

        <button
          type="submit"
          disabled={!publicKey || creating || loadingFee || !imageFile}
          className="w-full px-4 py-2 border border-black bg-white text-black rounded hover:bg-black hover:text-white hover:border-white transition-colors duration-200 disabled:bg-gray-400 disabled:text-gray-700 disabled:border-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {creating ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-black disabled:text-gray-700"
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
            "Loading..."
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
}