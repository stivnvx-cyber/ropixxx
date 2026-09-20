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

function mapItem(item: any) {
  return {
    videoId: item.id || item.videoId || "",
    title: item.title || item.name || item.title?.text || "",
    artists: item.artists || item.authors || (item.author ? [item.author] : []),
    thumbnails: (item.thumbnails || item.thumbnail?.contents || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
    duration: item.duration?.text || "",
    duration_seconds: item.duration?.seconds ?? item.duration?.duration_seconds ?? 0,
    resultType: item.item_type || item.type || "song",
    album: item.album?.name || item.album?.text,
  };
}

export async function ytSearch(q: string, filter?: string, limit = 20) {
  const inn = await getYT();
  const type = ytFilterToType(filter);
  try {
    const r: any = await inn.music.search(q, type ? { type } : undefined);
    let items: any[] = [];
    if (type) {
      const shelf = r.songs || r.videos || r.albums || r.playlists || r.artists;
      if (shelf?.contents?.length) items = shelf.contents;
      else if (Array.isArray(r.contents)) {
        for (const sec of r.contents) {
          if (sec.type === "MusicShelf" && sec.contents?.length) items.push(...sec.contents);
          else if (sec.type === "ItemSection" && sec.contents) {
            for (const inner of sec.contents) if (inner.type === "MusicShelf" && inner.contents) items.push(...inner.contents);
          }
        }
      }
    } else {
      for (const sec of (r.contents || [])) {
        if (sec.type === "MusicShelf" && sec.contents) items.push(...sec.contents);
        else if (sec.type === "ItemSection" && sec.contents) {
          for (const inner of sec.contents) if (inner.type === "MusicShelf" && inner.contents) items.push(...inner.contents);
        } else if (sec.type === "MusicCardShelf" && (sec as any).contents) items.push(...(sec as any).contents);
      }
      if (!items.length) {
        const shelf = r.songs || r.videos;
        if (shelf?.contents) items = shelf.contents;
      }
      if (!items.length && Array.isArray(r.contents)) items = r.contents;
    }
    const mapped = items.slice(0, limit * 2).map(mapItem).filter((x) => x.videoId);
    if (mapped.length) return mapped.slice(0, limit);
  } catch {}
  const raw = await ytmSearchRaw(q, limit);
  if (raw.length) return raw;
  return [];
}

async function ytmSearchRaw(q: string, limit: number) {
  try {
    const r = await fetch("https://music.youtube.com/youtubei/v1/search?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://music.youtube.com", "user-agent": "Mozilla/5.0" },
      body: JSON.stringify({ query: q, context: { client: { clientName: "WEB_REMIX", clientVersion: "1.20240102.01.00" } } }),
    });
    const j: any = await r.json();
    const tabs = j.contents?.tabbedSearchResultsRenderer?.tabs;
    const sectionList = tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    const out: any[] = [];
    for (const sec of sectionList) {
      const s = sec as any;
      if (s.musicShelfRenderer?.contents) {
        for (const c of s.musicShelfRenderer.contents) {
          const d = c.musicResponsiveListItemRenderer;
          if (!d) continue;
          const flex0 = d.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || "";
          const flex1 = d.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((x: any) => x.text).join("") || "";
          const vid = d.playlistItemData?.videoId || d.navigationEndpoint?.watchEndpoint?.videoId || d.doubleTapCommand?.watchEndpoint?.videoId || "";
          if (!vid) continue;
          const thumbs = d.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          out.push({ videoId: vid, title: flex0, artists: [{ name: flex1 }], thumbnails: thumbs.map((t: any) => ({ url: t.url })), duration: "", duration_seconds: 0, resultType: "song" });
        }
      }
    }
    return out.slice(0, limit);
  } catch { return []; }
}

async function fetchPlayerRaw(videoId: string, clientName: string, clientVersion: string, domain: string) {
  const endpoint = domain + "/youtubei/v1/player?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30";
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", origin: domain, "user-agent": "Mozilla/5.0" },
    body: JSON.stringify({ context: { client: { clientName, clientVersion } }, videoId }),
  });
  if (!r.ok) throw new Error("player " + r.status);
  return r.json() as Promise<any>;
}

export async function ytStream(videoId: string) {
  const inn = await getYT();
  let lastErr: unknown = null;
  const tryClients: Array<string | undefined> = [undefined, "YTMUSIC", "ANDROID", "IOS", "WEB"];
  for (const client of tryClients) {
    try {
      const info: any = client ? await inn.getInfo(videoId, { client: client as never }) : await inn.getInfo(videoId);
      const musicInfo: any = !client ? await inn.music.getInfo(videoId).catch(() => null) : null;
      const sd = info?.streaming_data || info?.streamingData;
      const msd = musicInfo?.streaming_data || musicInfo?.streamingData;
      const candidates: any[] = [];
      if (sd?.adaptive_formats) candidates.push(...sd.adaptive_formats);
      if (sd?.adaptiveFormats) candidates.push(...sd.adaptiveFormats);
      if (sd?.formats) candidates.push(...sd.formats);
      if (msd?.adaptive_formats) candidates.push(...msd.adaptive_formats);
      if (msd?.adaptiveFormats) candidates.push(...msd.adaptiveFormats);
      const audioOnly = candidates.filter((f: any) => {
        const mime = f.mime_type || f.mimeType || "";
        return mime.startsWith("audio/") && (f.url || f.signatureCipher || f.cipher);
      });
      const withUrl = audioOnly.filter((f: any) => f.url).sort((a: any, b: any) => (b.bitrate || b.bitRate || b.averageBitrate || 0) - (a.bitrate || a.bitRate || a.averageBitrate || 0));
      if (withUrl.length) {
        const best = withUrl[0] as any;
        const mime = best.mime_type || best.mimeType || "";
        const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") ? "mp4" : "m4a";
        return {
          videoId,
          title: info.basic_info?.title || musicInfo?.basic_info?.title || videoId,
          duration: info.basic_info?.duration || musicInfo?.basic_info?.duration || 0,
          url: best.url,
          ext,
          thumbnail: info.basic_info?.thumbnail?.[0]?.url || musicInfo?.basic_info?.thumbnail?.[0]?.url || "",
        };
      }
    } catch (e) { lastErr = e; }
  }
  const rawAttempts: Array<[string, string, string]> = [
    ["ANDROID", "19.29.37", "https://www.youtube.com"],
    ["IOS", "19.29.1", "https://www.youtube.com"],
    ["WEB_REMIX", "1.20240102.01.00", "https://music.youtube.com"],
  ];
  for (const [cName, cVer, domain] of rawAttempts) {
    try {
      const data = await fetchPlayerRaw(videoId, cName, cVer, domain);
      const sd = data.streamingData;
      const candidates: any[] = [...(sd?.adaptiveFormats || []), ...(sd?.formats || [])];
      const audio = candidates.filter((f: any) => (f.mimeType || "").startsWith("audio/") && f.url).sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      if (audio[0]?.url) {
        const mime = audio[0].mimeType || "";
        const ext = mime.includes("webm") ? "webm" : mime.includes("mp4") ? "mp4" : "m4a";
        return {
          videoId,
          title: data.videoDetails?.title || videoId,
          duration: parseInt(data.videoDetails?.lengthSeconds || "0", 10),
          url: audio[0].url,
          ext,
          thumbnail: data.videoDetails?.thumbnail?.thumbnails?.[0]?.url || "",
        };
      }
    } catch (e) { lastErr = e; }
  }
  throw new Error("no audio url for " + videoId + (lastErr ? ": " + String((lastErr as any)?.message || lastErr) : ""));
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
  try {
    const trending = await inn.music.search("top hits", { type: "song" });
    const shelf = trending.songs || trending.videos;
    const items = (shelf?.contents || []).slice(0, 12).map((item: any) => ({
      videoId: item.id || "",
      title: item.title || "",
      artists: item.artists || [],
      thumbnails: (item.thumbnails || []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
      duration_seconds: item.duration?.seconds || 0,
    })).filter((x: any) => x.videoId);
    if (items.length) return { trending: items, mood: [] };
  } catch {}
  const fallback = await ytmSearchRaw("top hits indonesia", 12);
  return { trending: fallback, mood: [] };
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
