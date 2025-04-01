// app/api/solana-rpc/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;

  let rpcUrl: string | undefined;

  if (network === 'mainnet') {
    rpcUrl = process.env.SOLANA_RPC_LIVE_ENDPOINT;
  } else if (network === 'devnet') {
    rpcUrl = process.env.SOLANA_RPC_DEV_ENDPOINT;
  }

  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'Missing or invalid Solana RPC endpoint' },
      { status: 500 }
    );
  }

  return NextResponse.json({ rpcUrl });
}
