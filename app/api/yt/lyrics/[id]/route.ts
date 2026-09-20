import { NextRequest, NextResponse } from "next/server";
import { ytLyrics } from "@/lib/ytNode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const lyrics = await ytLyrics(id);
    return NextResponse.json(lyrics);
  } catch (e) {
    return NextResponse.json({ error: "lyrics failed", detail: String(e) }, { status: 500 });
  }
}
