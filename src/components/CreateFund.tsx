"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";

export default function CreateFund() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
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

  // Fetch the creation fee from the backend
  useEffect(() => {
    const fetchFee = async () => {
      try {
        setLoadingFee(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds/fee`);
        setCreationFee(response.data.fee);
      } catch (error) {
        console.error("Failed to fetch creation fee:", error);
        setCreationFee(0.1); // Fallback to default if fetch fails
      } finally {
        setLoadingFee(false);
      }
    };

    fetchFee();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction || creationFee === null) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/funds`,
        { ...form, userWallet: publicKey.toBase58() }
      );
      const fund = response.data;

      const fundWalletAddress = new PublicKey(fund.fundWalletAddress);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: fundWalletAddress,
          lamports: creationFee * LAMPORTS_PER_SOL, // Use dynamic fee
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      alert(`Fund created and ${creationFee} SOL sent successfully!`);
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
    } catch (error) {
      console.error(error);
      alert(`Failed to create fund or send ${creationFee} SOL.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
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
        className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
        disabled={loadingFee || creationFee === null}
      >
        {loadingFee
          ? "Loading Fee..."
          : `Create Fund and Send ${creationFee} SOL`}
      </button>
    </form>
  );
}