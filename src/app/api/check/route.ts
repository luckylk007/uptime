import { NextRequest, NextResponse } from "next/server";
import { checkMultipleUrls } from "@/lib/checker";
import type { CheckResponse } from "@/lib/types";

const MAX_URLS = 5;
const MAX_BODY_BYTES = 16384; // 16 KB max request size

export async function POST(req: NextRequest): Promise<NextResponse<CheckResponse>> {
  try {
    // Check request size
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json(
        { results: [], error: "Request payload too large (max 16KB)" },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { results: [], error: "Malformed JSON in request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { results: [], error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const { urls } = body;
    if (!urls) {
      return NextResponse.json(
        { results: [], error: "Missing required field 'urls'" },
        { status: 400 }
      );
    }

    if (!Array.isArray(urls)) {
      return NextResponse.json(
        { results: [], error: "Field 'urls' must be an array of strings" },
        { status: 400 }
      );
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { results: [], error: "Array 'urls' must contain at least 1 URL" },
        { status: 400 }
      );
    }

    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { results: [], error: `Exceeded maximum of ${MAX_URLS} URLs per request` },
        { status: 400 }
      );
    }

    // String type check
    for (let i = 0; i < urls.length; i++) {
      if (typeof urls[i] !== "string") {
        return NextResponse.json(
          { results: [], error: `All items in 'urls' must be strings (index ${i} is invalid)` },
          { status: 400 }
        );
      }
    }

    const results = await checkMultipleUrls(urls);
    return NextResponse.json({ results }, { status: 200 });
  } catch {
    return NextResponse.json(
      { results: [], error: "An unexpected error occurred while processing the check request" },
      { status: 500 }
    );
  }
}