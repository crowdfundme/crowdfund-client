import { Connection, clusterApiUrl } from "@solana/web3.js";

// Function to get the Solana connection (created at runtime)
export const getConnection = () => {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  return new Connection(
    network === "mainnet" ? clusterApiUrl("mainnet-beta") : clusterApiUrl("devnet"),
    "confirmed"
  );
};