import { NextResponse } from "next/server";

export async function GET() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  console.log(`[API] Fetching RPC for network: ${network}`);

  let rpcUrl: string | undefined;

  if (network === "mainnet") {
    rpcUrl = process.env.SOLANA_RPC_LIVE_ENDPOINT;
  } else if (network === "devnet") {
    rpcUrl = process.env.SOLANA_RPC_DEV_ENDPOINT;
  }

  if (!rpcUrl || rpcUrl.includes("SOLANA_RPC")) {
    console.error(`[API] Invalid RPC endpoint for network ${network}: ${rpcUrl}`);
    return NextResponse.json(
      { error: "Missing or invalid Solana RPC endpoint" },
      { status: 500 }
    );
  }

  console.log(`[API] Returning RPC URL: ${rpcUrl}`);
  return NextResponse.json({ rpcUrl });
}