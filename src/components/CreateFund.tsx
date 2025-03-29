"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection } from "../lib/solana";
import { useRouter } from "next/navigation";

// Add a counter to track renders
let renderCount = 0;

export default function CreateFund() {
  renderCount++;
  console.log(`CreateFund: Render count - ${renderCount}`);

  const { publicKey } = useWallet();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    image: "",
    tokenName: "",
    tokenSymbol: "",
    tokenDescription: "",
    targetPercentage: 25,
    targetWallet: "",
    tokenTwitter: "",
    tokenTelegram: "",
    tokenWebsite: "",
  });
  const [creationFee, setCreationFee] = useState<number | null>(null);
  const [loadingFee, setLoadingFee] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    console.log("CreateFund: useEffect running...");
    isMounted.current = true;

    const fetchFee = async () => {
      if (hasFetched.current) {
        console.log("CreateFund: Fee already fetched, skipping...");
        return;
      }

      if (!process.env.NEXT_PUBLIC_API_URL) {
        if (isMounted.current) {
          setError("API URL is not configured. Please contact support.");
          setLoadingFee(false);
        }
        return;
      }

      try {
        console.log("CreateFund: Fetching creation fee...");
        setLoadingFee(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds/fee`);
        console.log("CreateFund: Fee response:", response.data);
        if (isMounted.current) {
          setCreationFee(response.data.creationFee);
          hasFetched.current = true;
        }
      } catch (error) {
        console.error("CreateFund: Failed to fetch creation fee:", error);
        if (isMounted.current) {
          setError("Failed to load creation fee. Please try again later.");
          setCreationFee(null);
        }
      } finally {
        if (isMounted.current) {
          setLoadingFee(false);
        }
      }
    };

    fetchFee();

    return () => {
      console.log("CreateFund: Unmounting...");
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || creationFee === null) {
      setError("Cannot create fund: Creation fee not loaded or wallet not connected.");
      return;
    }

    // Validate target wallet
    try {
      new PublicKey(form.targetWallet);
    } catch (err) {
      setError("Invalid target wallet address. Please enter a valid Solana wallet address.");
      return;
    }

    // Validate image URL (optional field)
    if (form.image) {
      const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i;
      if (!urlPattern.test(form.image)) {
        setError("Invalid image URL. Please enter a valid URL (e.g., https://example.com/image.png) or leave it blank.");
        return;
      }
    }

    if (!process.env.NEXT_PUBLIC_WEBSITE_WALLET) {
      setError("Website wallet address is not configured. Please contact support.");
      return;
    }

    try {
      setError(null);

      const connection = getConnection();
      const solBalance = await connection.getBalance(publicKey);
      if (solBalance < 5000) {
        throw new Error("Insufficient SOL for transaction fees. Please add at least 0.01 SOL to your wallet.");
      }

      const fundWalletAddress = new PublicKey(process.env.NEXT_PUBLIC_WEBSITE_WALLET);
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

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/funds`, {
        ...form,
        userWallet: publicKey.toBase58(),
        txSignature: signature,
      });

      alert(`Fund created successfully! Transaction signature: ${signature}`);
      setForm({
        name: "",
        image: "",
        tokenName: "",
        tokenSymbol: "",
        tokenDescription: "",
        targetPercentage: 25,
        targetWallet: "",
        tokenTwitter: "",
        tokenTelegram: "",
        tokenWebsite: "",
      });
      router.push("/explore");
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "Failed to create fund.";
      if (errorMsg.includes("User rejected the request") || (error.code && error.code === 4001)) {
        setError("Transaction canceled. Please try again if you wish to proceed.");
      } else {
        setError(error.response?.data?.error || errorMsg);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="text"
        placeholder="Fund Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Image URL"
        value={form.image}
        onChange={(e) => setForm({ ...form, image: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Token Name"
        value={form.tokenName}
        onChange={(e) => setForm({ ...form, tokenName: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Token Symbol"
        value={form.tokenSymbol}
        onChange={(e) => setForm({ ...form, tokenSymbol: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
        required
      />
      <textarea
        placeholder="Token Description"
        value={form.tokenDescription}
        onChange={(e) => setForm({ ...form, tokenDescription: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
        required
      />
      <select
        value={form.targetPercentage}
        onChange={(e) => setForm({ ...form, targetPercentage: Number(e.target.value) })}
        className="block w-full mb-4 p-2 border rounded"
      >
        <option value={5}>5% (1.480938417 SOL)</option>
        <option value={10}>10% (3.114080165 SOL)</option>
        <option value={10}>10% (3.114080165 SOL)</option>
        <option value={25}>25% (9.204131229 SOL)</option>
        <option value={50}>50% (26.439790577 SOL)</option>
        <option value={75}>75% (70.356037153 SOL)</option>
      </select>
      <input
        type="text"
        placeholder="Target Wallet Address"
        value={form.targetWallet}
        onChange={(e) => setForm({ ...form, targetWallet: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Twitter URL (optional)"
        value={form.tokenTwitter}
        onChange={(e) => setForm({ ...form, tokenTwitter: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Telegram URL (optional)"
        value={form.tokenTelegram}
        onChange={(e) => setForm({ ...form, tokenTelegram: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Website URL (optional)"
        value={form.tokenWebsite}
        onChange={(e) => setForm({ ...form, tokenWebsite: e.target.value })}
        className="block w-full mb-4 p-2 border rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded flex items-center justify-center"
        disabled={loadingFee || creationFee === null}
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
          ? `Create Fund and Send ${creationFee} SOL`
          : "Unable to Load Fee"}
      </button>
    </form>
  );
}