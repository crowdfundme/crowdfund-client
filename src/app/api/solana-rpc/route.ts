// src/app/api/solana-rpc/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet";
  console.log(`[API] Fetching RPC proxy for network: ${network}`);

  const proxyUrl = `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}/api/solana-rpc/proxy`;

  console.log(`[API] Returning proxy RPC URL: ${proxyUrl}`);
  return NextResponse.json({ rpcUrl: proxyUrl });
}