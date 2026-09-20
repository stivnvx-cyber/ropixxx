import { NextRequest, NextResponse } from "next/server";
import { ytSearch } from "@/lib/ytNode";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });
  const filter = req.nextUrl.searchParams.get("filter") || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);
  try {
    const results = await ytSearch(q, filter, limit);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: "search failed", detail: String(e) }, { status: 500 });
  }
}
