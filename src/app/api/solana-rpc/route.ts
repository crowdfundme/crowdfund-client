// src/app/api/solana-rpc/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const network = process.env.SOLANA_NETWORK || "mainnet";
    const rpcUrl = network === "mainnet"
      ? process.env.SOLANA_RPC_LIVE_ENDPOINT
      : process.env.SOLANA_RPC_DEV_ENDPOINT;
    const apiKey = process.env.API_KEY;

    if (!rpcUrl) {
      console.error(`[API] No RPC endpoint configured for ${network}`);
      return NextResponse.json({ error: "RPC endpoint not configured" }, { status: 500 });
    }

    console.log(`[API] Serving RPC URL for ${network}: ${rpcUrl}`);
    return NextResponse.json({ rpcUrl, apiKey });
  } catch (error) {
    console.error("[API] Error fetching RPC URL:", error);
    return NextResponse.json({ error: "Failed to fetch RPC URL" }, { status: 500 });
  }
}

export const runtime = "nodejs";