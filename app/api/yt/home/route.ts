import { NextResponse } from "next/server";
import { ytHome } from "@/lib/ytNode";

export async function GET() {
  try {
    const home = await ytHome();
    return NextResponse.json(home);
  } catch (e) {
    return NextResponse.json({ error: "home failed", detail: String(e) }, { status: 500 });
  }
}
