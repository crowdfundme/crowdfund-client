"use client";

import { useState } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export default function CreateFund() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [form, setForm] = useState({
    name: "",
    image: "",
    tokenName: "",
    tokenSymbol: "",
    targetPercentage: 25,
    targetWallet: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return;

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
          lamports: 0.1 * LAMPORTS_PER_SOL,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      alert("Fund created and 0.1 SOL sent successfully!");
      setForm({ name: "", image: "", tokenName: "", tokenSymbol: "", targetPercentage: 25, targetWallet: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to create fund or send 0.1 SOL.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <input type="text" placeholder="Fund Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="block w-full mb-4 p-2 border rounded" />
      <input type="text" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="block w-full mb-4 p-2 border rounded" />
      <input type="text" placeholder="Token Name" value={form.tokenName} onChange={(e) => setForm({ ...form, tokenName: e.target.value })} className="block w-full mb-4 p-2 border rounded" />
      <input type="text" placeholder="Token Symbol" value={form.tokenSymbol} onChange={(e) => setForm({ ...form, tokenSymbol: e.target.value })} className="block w-full mb-4 p-2 border rounded" />
      <select value={form.targetPercentage} onChange={(e) => setForm({ ...form, targetPercentage: Number(e.target.value) })} className="block w-full mb-4 p-2 border rounded">
        <option value={5}>5% (1.480938417 SOL)</option>
        <option value={10}>10% (3.114080165 SOL)</option>
        <option value={25}>25% (9.204131229 SOL)</option>
        <option value={50}>50% (26.439790577 SOL)</option>
        <option value={75}>75% (70.356037153 SOL)</option>
      </select>
      <input type="text" placeholder="Target Wallet Address" value={form.targetWallet} onChange={(e) => setForm({ ...form, targetWallet: e.target.value })} className="block w-full mb-4 p-2 border rounded" />
      <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">Create Fund and Send 0.1 SOL</button>
    </form>
  );
}