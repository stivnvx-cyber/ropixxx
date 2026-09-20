import { NextRequest, NextResponse } from "next/server";
import { ytWatch } from "@/lib/ytNode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const watch = await ytWatch(id);
    return NextResponse.json(watch);
  } catch (e) {
    return NextResponse.json({ error: "watch failed", detail: String(e) }, { status: 500 });
  }
}
