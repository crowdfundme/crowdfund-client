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

    console.log(`Initiating donation of ${amount} SOL to fund ${fundId}...`);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, donorWallet: publicKey.toBase58() }),
      });
      alert("Donation successful!");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds?status=${status}`);
      return response.data;
    } catch (error) {
      console.error(error);
      alert("Donation failed.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {funds.map((fund) => {
        console.log(`Fund ${fund._id}: currentDonatedSol=${fund.currentDonatedSol}, targetSolAmount=${fund.targetSolAmount}, targetPercentage=${fund.targetPercentage}`);

        const progress = Math.min(
          (fund.currentDonatedSol / fund.targetSolAmount) * 100,
          100
        );

        const supplyRaisedPercentage = (fund.currentDonatedSol / fund.targetSolAmount) * fund.targetPercentage;

        return (
          <div key={fund._id} className="border border-gray-300 rounded-lg p-4">
            <div className="w-full h-32 bg-gray-900 rounded-lg mb-2"></div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Name:</span> {fund.name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Ticker:</span> {fund.tokenSymbol}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Description:</span>{" "}
              {fund.tokenDescription.length > 50
                ? `${fund.tokenDescription.slice(0, 50)}...`
                : fund.tokenDescription}
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
              {supplyRaisedPercentage.toFixed(2)}% (Target: {fund.targetPercentage}%)
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
              {progress.toFixed(2)}% ({fund.currentDonatedSol}/{fund.targetSolAmount} SOL)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {status === "completed" && fund.completedAt && (
              <p className="text-sm text-gray-700 mt-2">
                <span className="font-semibold">Completed:</span>{" "}
                {new Date(fund.completedAt).toLocaleString()}
              </p>
            )}
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
        );
      })}
    </div>
  );
}