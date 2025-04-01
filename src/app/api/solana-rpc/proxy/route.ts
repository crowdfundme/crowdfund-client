// src/app/api/solana-rpc/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

interface FetchRequestInit extends RequestInit {
  duplex?: "half" | undefined;
}

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest) {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet";
  const targetRpc = network === "mainnet"
    ? process.env.SOLANA_RPC_LIVE_ENDPOINT
    : process.env.SOLANA_RPC_DEV_ENDPOINT;

  if (!targetRpc) {
    console.error(`[API] No RPC endpoint configured for ${network}`);
    return NextResponse.json({ error: "RPC endpoint not configured" }, { status: 500 });
  }

  console.log(`[API] Proxying ${req.method} request to ${targetRpc}`);

  const url = new URL(targetRpc);
  const method = req.method;
  const headers = new Headers(req.headers);
  headers.set("Host", url.host);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json"); // Match curl’s implicit behavior
  // Avoid compression to match curl’s uncompressed response
  headers.delete("Accept-Encoding");

  try {
    const response = await fetch(targetRpc, {
      method,
      headers,
      body: method !== "GET" && method !== "HEAD" ? req.body : undefined,
      duplex: method !== "GET" && method !== "HEAD" ? "half" : undefined,
    } as FetchRequestInit);

    console.log(`[API] Upstream status: ${response.status}`);
    console.log(`[API] Upstream headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Upstream error: ${response.status} ${response.statusText} - ${errorText}`);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    // Buffer response as text to match curl’s output
    const text = await response.text();
    console.log(`[API] Upstream body:`, text);

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json", // Force JSON as curl gets
        "Content-Length": text.length.toString(),
      },
    });
  } catch (error) {
    console.error(`[API] Proxy error:`, error);
    return NextResponse.json({ error: "Failed to proxy RPC request" }, { status: 500 });
  }
}

export const runtime = "nodejs";