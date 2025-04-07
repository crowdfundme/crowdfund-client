// src/app/api/backend/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const { path } = params;
  const url = new URL(`${process.env.API_URL}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.append(key, value));
  console.log(`[Proxy GET] Forwarding to: ${url.toString()}`);
  return handleRequest(req, url.toString());
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const { path } = params;
  const url = new URL(`${process.env.API_URL}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.append(key, value));
  
  const contentType = req.headers.get("Content-Type") || "application/json";
  let body: Buffer | string | undefined;
  if (contentType.includes("multipart/form-data")) {
    body = Buffer.from(await req.arrayBuffer());
    console.log(`[Proxy POST] Forwarding multipart/form-data to: ${url.toString()}`, {
      contentLength: body.length,
      contentType,
    });
  } else {
    body = await req.text();
    console.log(`[Proxy POST] Forwarding to: ${url.toString()} with body:`, body);
  }

  return handleRequest(req, url.toString(), body);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  const { path } = params;
  const url = new URL(`${process.env.API_URL}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => url.searchParams.append(key, value));
  
  const contentType = req.headers.get("Content-Type") || "application/json";
  const body = await req.text();
  console.log(`[Proxy PUT] Forwarding to: ${url.toString()} with body:`, body);

  return handleRequest(req, url.toString(), body);
}

async function handleRequest(req: NextRequest, url: string, body?: Buffer | string) {
  try {
    const clientHeaders = Object.fromEntries(req.headers.entries());
    const headers: Record<string, string> = {
      "Cache-Control": "no-cache",
      "X-API-Key": clientHeaders["x-api-key"],
      "X-From-Vercel": clientHeaders["x-from-vercel"] || "true",
    };
    const contentType = req.headers.get("Content-Type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log(`[Proxy] Response from ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
    });

    const responseContentType = responseHeaders["content-type"] || "";
    let data;
    if (responseContentType.includes("application/json")) {
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`[Proxy] Failed to parse JSON from ${url}:`, jsonError, { responseText });
        return NextResponse.json(
          { error: "Invalid JSON response from backend", rawResponse: responseText },
          { status: 500 }
        );
      }
    } else {
      console.warn(`[Proxy] Unexpected Content-Type from ${url}: ${responseContentType}`);
      return new NextResponse(responseText, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.error || "Backend error" }, { status: response.status });
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-cache" },
    });
  } catch (error) {
    console.error(`[Proxy] Error calling backend at ${url}:`, error);
    return NextResponse.json({ error: "Failed to call backend" }, { status: 500 });
  }
}

export const runtime = "nodejs";