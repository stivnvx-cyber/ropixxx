import { Innertube, type Innertube as InnertubeType } from "youtubei.js";

let yt: InnertubeType | null = null;
async function getYT(): Promise<InnertubeType> {
  if (yt) return yt;
  yt = await Innertube.create({ lang: "en", location: "ID" });
  return yt;
}

function ytFilterToType(f?: string): "song" | "video" | "album" | "playlist" | "artist" | "all" | undefined {
  if (!f) return undefined;
  const map: Record<string, "song" | "video" | "album" | "playlist" | "artist" | "all"> = {
    songs: "song", videos: "video", albums: "album", playlists: "playlist", artists: "artist",
    "community playlists": "playlist", "featured playlists": "playlist",
  };
  return map[f.toLowerCase()] || "song";
}

export async function ytSearch(q: string, filter?: string, limit = 20) {
  const inn = await getYT();
  const type = ytFilterToType(filter);
  const r = await inn.music.search(q, type ? { type } : undefined);
  const shelf = r.songs || r.videos || r.albums || r.playlists || r.artists;
  const items = shelf?.contents || r.contents;
  return (items || []).slice(0, limit).map((item: any) => {
    if (item.item_type === "song" || item.item_type === "video") {
      return {
        videoId: item.id || "",
        title: item.title || "",
        artists: item.artists || [],
        thumbnails: (item.thumbnails || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
        duration: item.duration?.text || "",
        duration_seconds: item.duration?.seconds || 0,
        resultType: item.item_type,
        album: item.album?.name,
      };
    }
    return {
      videoId: item.id || "",
      title: item.title?.text || item.name || "",
      artists: item.artists || item.authors || item.author || [],
      thumbnails: (item.thumbnails || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
      duration: item.duration?.text || "",
      duration_seconds: item.duration?.seconds || 0,
      resultType: item.item_type || item.type || "unknown",
      album: item.album?.name,
    };
  });
}

export async function ytStream(videoId: string) {
  const inn = await getYT();
  const info = await inn.getInfo(videoId);
  const formats = info.streaming_data?.adaptive_formats || [];
  const audioOnly = formats.filter((f: any) => f.mime_type?.startsWith("audio/") && f.url)
    .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
  const best = audioOnly[0] as any;
  if (!best?.url) throw new Error("no audio url for " + videoId);
  const ext = best.mime_type?.includes("webm") ? "webm" : "m4a";
  return {
    videoId,
    title: info.basic_info?.title || videoId,
    duration: info.basic_info?.duration || 0,
    url: best.url,
    ext,
    thumbnail: info.basic_info?.thumbnail?.[0]?.url || "",
  };
}

export async function ytLyrics(videoId: string) {
  const inn = await getYT();
  let title = "", artist = "";
  try {
    const info = await inn.getInfo(videoId);
    title = info.basic_info?.title || "";
    artist = info.basic_info?.author || "";
  } catch {}

  try {
    const shelf = await inn.music.getLyrics(videoId);
    if (shelf?.description?.text) {
      const txt = shelf.description.text;
      const synced = parseLrcText(txt);
      if (synced) return { ...synced, title, artist };
      return { lyrics: txt, hasTimestamps: false, source: "ytm", title, artist };
    }
  } catch {}

  if (title) {
    const fb = await lrclibFallback(title, artist);
    if (fb) return { ...fb, title, artist };
  }
  return { lyrics: null, hasTimestamps: false, source: "none", title, artist };
}

export async function ytHome() {
  const inn = await getYT();
  const trending = await inn.music.search("top hits", { type: "song" });
  const shelf = trending.songs || trending.videos;
  const items = (shelf?.contents || []).slice(0, 12).map((item: any) => ({
    videoId: item.id || "",
    title: item.title || "",
    artists: item.artists || [],
    thumbnails: (item.thumbnails || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
    duration_seconds: item.duration?.seconds || 0,
  }));
  return { trending: items, mood: [] };
}

export async function ytPlaylist(playlistId: string, limit = 100) {
  const inn = await getYT();
  const r = await inn.music.getPlaylist(playlistId);
  const header = r.header as any;
  const title = header?.title?.text || "";
  const description = header?.description?.description?.text || header?.description?.text || "";
  const thumbnails = header?.thumbnail?.contents?.map((t: any) => ({ url: t.url }))
    || header?.thumbnails?.map((t: any) => ({ url: t.url })) || [];
  const author = header?.author?.name || header?.subtitle?.text || "";
  const tracks = (r.contents || []).slice(0, limit).map((item: any) => ({
    videoId: item.id || "",
    title: item.title?.text || "",
    artists: item.artists || item.authors || item.author || [],
    thumbnails: (item.thumbnails || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
    duration: item.duration?.text || "",
  }));
  return { title, author, description, thumbnails, tracks };
}

export async function ytWatch(videoId: string) {
  const inn = await getYT();
  const upNext = await inn.music.getUpNext(videoId).catch(() => null);
  const tracks = (upNext?.contents || []).map((item: any) => ({
    videoId: item.video_id || "",
    title: item.title?.text || "",
    artists: item.artists || [],
    thumbnails: (item.thumbnail || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
  }));
  return { tracks };
}

function parseLrcText(text: string) {
  const lines: { text: string; start_time: number; end_time: number }[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
    if (!m) continue;
    const t = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 100;
    if (m[4].trim()) lines.push({ text: m[4].trim(), start_time: Math.round(t * 1000), end_time: Math.round(t * 1000) + 3000 });
  }
  if (!lines.length) return null;
  return { lyrics: lines, hasTimestamps: true, source: "ytm lrc" };
}

async function lrclibFallback(title: string, artist: string) {
  try {
    let r = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
    if (r.ok) {
      const j = await r.json() as { syncedLyrics?: string; plainLyrics?: string };
      if (j.syncedLyrics) { const p = parseLrcText(j.syncedLyrics); if (p) return { ...p, source: "lrclib.net", fallback: true }; }
      if (j.plainLyrics) return { lyrics: j.plainLyrics, hasTimestamps: false, source: "lrclib.net", fallback: true };
    }
    r = await fetch(`https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`);
    if (r.ok) {
      const arr = await r.json() as Array<{ syncedLyrics?: string; plainLyrics?: string }>;
      for (const j of arr.slice(0, 3)) {
        if (j.syncedLyrics) { const p = parseLrcText(j.syncedLyrics); if (p) return { ...p, source: "lrclib search", fallback: true }; }
        if (j.plainLyrics) return { lyrics: j.plainLyrics, hasTimestamps: false, source: "lrclib search", fallback: true };
      }
    }
  } catch {}
  return null;
}
