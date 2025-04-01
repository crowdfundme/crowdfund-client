// src/utils/solana.ts
import { Connection } from "@solana/web3.js";
import { getSolanaRpcUrl } from "../utils/getSolanaRpcUrl";

export const getConnection = async (): Promise<Connection> => {
  const rpcUrl = await getSolanaRpcUrl();
  console.log("[solana.ts] Using RPC URL:", rpcUrl);
  return new Connection(rpcUrl, "confirmed");
};