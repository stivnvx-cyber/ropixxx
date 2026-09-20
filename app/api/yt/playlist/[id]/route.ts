import { NextRequest, NextResponse } from "next/server";
import { ytPlaylist } from "@/lib/ytNode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const playlist = await ytPlaylist(id);
    return NextResponse.json(playlist);
  } catch (e) {
    return NextResponse.json({ error: "playlist failed", detail: String(e) }, { status: 500 });
  }
}
