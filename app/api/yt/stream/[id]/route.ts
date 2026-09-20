import { NextRequest, NextResponse } from "next/server";
import { ytStream } from "@/lib/ytNode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const stream = await ytStream(id);
    return NextResponse.json(stream);
  } catch (e) {
    return NextResponse.json({ error: "stream failed", detail: String(e) }, { status: 500 });
  }
}
