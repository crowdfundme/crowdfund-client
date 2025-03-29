"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Fund } from "../types";
import { useWallet } from "@solana/wallet-adapter-react";
import { connection } from "../lib/solana";
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import Image from "next/image";

export default function FundList() {
  const { publicKey, signTransaction } = useWallet();
  const [funds, setFunds] = useState<Fund[]>([]);

  useEffect(() => {
    const fetchFunds = async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds`);
      setFunds(response.data);
    };
    fetchFunds();
  }, []);

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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/funds`);
      setFunds(response.data);
    } catch (error) {
      console.error(error);
      alert("Donation failed.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {funds.map((fund) => (
        <div key={fund._id} className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">{fund.name}</h2>
          <Image src={fund.image} alt={fund.name} width={128} height={128} className="object-cover rounded my-2" />
          <p>Token: {fund.tokenName} ({fund.tokenSymbol})</p>
          <p>Target: {fund.targetPercentage}% ({fund.targetSolAmount} SOL)</p>
          <p>Current: {fund.currentDonatedSol} SOL</p>
          <p className="text-sm text-gray-600">Fund Wallet: {fund.fundWalletAddress.slice(0, 6)}...{fund.fundWalletAddress.slice(-4)}</p>
          <p className="text-sm text-gray-600">Target Wallet: {fund.targetWallet.slice(0, 6)}...{fund.targetWallet.slice(-4)}</p>
          <button
            onClick={() => donate(fund._id, fund.fundWalletAddress, 0.1)}
            className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
            disabled={fund.status === "completed"}
          >
            Donate 0.1 SOL
          </button>
        </div>
      ))}
    </div>
  );
}