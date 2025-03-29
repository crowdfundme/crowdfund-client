"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { connection } from "../lib/solana";
import Image from "next/image";
import { Fund } from "../types";
import axios from "axios";

interface FundListProps {
  funds: Fund[];
  status: "active" | "completed";
}

export default function FundList({ funds, status }: FundListProps) {
  const { publicKey, signTransaction } = useWallet();

  const donate = async (fundId: string, fundWalletAddress: string, amount: number) => {
    if (!publicKey || !signTransaction) return;

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(fundWalletAddress),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funds/${fundId}/donate`, {
        method: "POST",
      });
      alert("Donation successful!");
      // Refresh funds after donation (you might want to lift this state up to the parent)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=${status}`);
      return response.data; // Parent can handle the updated funds
    } catch (error) {
      console.error(error);
      alert("Donation failed.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {funds.map((fund) => (
        <div key={fund._id} className="border border-gray-300 rounded-lg p-4">
          <div className="w-full h-32 bg-gray-900 rounded-lg mb-2"></div> {/* Placeholder for image */}
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Name:</span> {fund.name}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Ticker:</span> {fund.tokenSymbol}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Supply raised:</span> {fund.targetPercentage}%
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
            <span className="font-semibold">{status === "active" ? "0%" : "100%"}:</span>{" "}
            {fund.currentDonatedSol}/{fund.targetSolAmount} SOL
          </p>
          {status === "active" && (
            <button
              onClick={() => donate(fund._id, fund.fundWalletAddress, 0.1)}
              className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
              disabled={!publicKey}
            >
              Donate 0.1 SOL
            </button>
          )}
        </div>
      ))}
    </div>
  );
}