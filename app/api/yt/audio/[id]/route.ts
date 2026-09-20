import { NextRequest, NextResponse } from "next/server";
import { ytStream } from "@/lib/ytNode";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const s = await ytStream(id);
    const upstream = await fetch(s.url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        range: _req.headers.get("range") || "bytes=0-",
      },
    });
    const headers = new Headers();
    headers.set("content-type", s.ext === "webm" ? "audio/webm" : "audio/mp4");
    headers.set("accept-ranges", "bytes");
    headers.set("cache-control", "private, max-age=3600");
    const cl = upstream.headers.get("content-length");
    if (cl) headers.set("content-length", cl);
    const cr = upstream.headers.get("content-range");
    if (cr) headers.set("content-range", cr);
    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (e) {
    return NextResponse.json({ error: "audio proxy failed", detail: String(e) }, { status: 500 });
  }
}
