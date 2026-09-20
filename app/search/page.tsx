"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Search as SearchIcon, Camera, X, Loader2, Play, Plus } from "lucide-react";
import { usePlaylistStore } from "@/store/playlistStore";
import { usePlayerStore } from "@/store/playerStore";
import { useUiStore } from "@/store/uiStore";
import { USER } from "@/lib/data/spotify";
const BROWSE = [
  { title: "Live Events", color: "bg-[#E13300]" },
  { title: "Made For You", color: "bg-[#1E3264]" },
  { title: "Podcasts", color: "bg-[#477D95]" },
  { title: "New Releases", color: "bg-[#8C1932]" },
  { title: "Discover", color: "bg-[#E8115B]" },
  { title: "Pop", color: "bg-[#148A08]" },
  { title: "Hindi", color: "bg-[#D84000]" },
  { title: "Punjabi", color: "bg-[#777777]" },
  { title: "Tamil", color: "bg-[#BA5D07]" },
  { title: "Telugu", color: "bg-[#E61E32]" },
  { title: "Party", color: "bg-[#8D67AB]" },
  { title: "Chill", color: "bg-[#0D73EC]" },
];
const EXPLORE = [
  { label: "#Trending Now", colors: "from-[#8D67AB] to-[#4A148C]" },
  { label: "Telugu Hits", colors: "from-[#E13300] to-[#8C1932]" },
  { label: "Romance", colors: "from-[#E8115B] to-[#E13300]" },
  { label: "Workout", colors: "from-[#148A08] to-[#1E3264]" },
];
type YtItem = { videoId?: string; title: string; artists?: { name: string }[]; artist?: string; thumbnails?: { url: string }[]; resultType: string; duration_seconds?: number };
export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<YtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { playSong } = usePlayerStore();
  const { setDrawerOpen } = useUiStore();
  const { playlists, add } = usePlaylistStore();
  const [pickFor, setPickFor] = useState<YtItem | null>(null);
  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/yt/search?q=${encodeURIComponent(trimmed)}&limit=20&filter=songs`);
        const data: YtItem[] = await r.json();
        setResults(data.filter((x) => x.videoId));
      } catch { setResults([]); }
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => { if (!q.trim()) setResults([]); }, [q]);
  async function playYt(item: YtItem) {
    if (!item.videoId) return;
    try {
      const s = await fetch(`/api/yt/stream/${item.videoId}`).then((r) => r.json());
      const url: string = s.url || "";
      const queue = results.map((r) => ({ id: r.videoId!, title: r.title, artist: r.artists?.map((a) => a.name).join(", ") || r.artist || "", album: "", coverUrl: r.thumbnails?.[r.thumbnails.length - 1]?.url || "", audioUrl: r.videoId === item.videoId ? url : "", duration: r.duration_seconds || 0 } as const));
      const song = queue.find((x) => x.id === item.videoId) as never;
      playSong(song, queue as never);
      fetch(`/api/yt/lyrics/${item.videoId}`).then((r)=>r.json()).then((d)=>{
        if (d?.hasTimestamps && Array.isArray(d.lyrics)) {
          const lyrics = d.lyrics.map((l:{text:string;start_time?:number})=>({ time:(l.start_time||0)/1000, text:l.text }));
          usePlayerStore.setState({ currentSong:{ ...(usePlayerStore.getState().currentSong as object), lyrics } as never });
        } else if (typeof d?.lyrics==="string" && d.lyrics.trim()) {
          const lyrics = d.lyrics.split("\n").filter(Boolean).map((t:string,i:number)=>({ time:i*3, text:t }));
          usePlayerStore.setState({ currentSong:{ ...(usePlayerStore.getState().currentSong as object), lyrics } as never });
        }
      }).catch(()=>{});
    } catch {}
  }
  return (
    <div>
      <div className="sticky top-0 z-10 bg-[#121212] px-4 pt-3 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="min-w-[44px] min-h-[44px] rounded-full overflow-hidden flex items-center justify-center"><Image src={USER.avatar} alt="avatar" width={32} height={32} className="object-cover" /></button>
          <h1 className="text-xl font-bold text-white flex-1">Search</h1>
          <button aria-label="Camera search" className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white"><Camera className="w-5 h-5" /></button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="What do you want to listen to?" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" className="w-full bg-white text-black placeholder:text-[#535353] rounded-md pl-9 pr-8 py-2.5 text-base font-medium focus:outline-none" />
          {q && <button onClick={()=>setQ("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-black"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      {q.trim() ? (
        <div className="px-2 pb-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-[#B3B3B3]"><Loader2 className="w-4 h-4 animate-spin" />Searching YouTube Music…</div>
          ) : results.length===0 ? <p className="text-sm text-[#B3B3B3] px-2 py-8 text-center">No results for &quot;{q}&quot;</p> : results.map((s) => (
            <div key={s.videoId} className="flex items-center gap-2 w-full px-2 py-1 rounded-md hover:bg-white/10">
              <button onClick={()=>playYt(s)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="relative w-10 h-10 rounded-[2px] overflow-hidden flex-shrink-0 bg-[#2A2A2A]">{s.thumbnails?.[0]?.url ? <Image src={s.thumbnails[s.thumbnails.length-1].url} alt={s.title} fill className="object-cover" sizes="40px" unoptimized /> : null}</div>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white truncate">{s.title}</p><p className="text-xs text-[#B3B3B3] truncate">Song • {s.artists?.map(a=>a.name).join(", ") || s.artist || ""}</p></div>
              </button>
              <button onClick={()=>setPickFor(s)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70"><Plus className="w-5 h-5"/></button>
              <button onClick={()=>playYt(s)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0"><Play className="w-4 h-4 fill-black text-black ml-0.5" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 pb-6">
          <section className="mt-2">
            <h2 className="text-[15px] font-bold text-white mb-3">Picked for you</h2>
            <div className="grid grid-cols-2 gap-3">
              {EXPLORE.map(e => (
                <button key={e.label} onClick={()=>setQ(e.label.replace('#',''))} className={`rounded-lg h-20 p-3 text-left bg-gradient-to-br ${e.colors} flex items-end`}>
                  <span className="text-sm font-bold text-white">{e.label}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="mt-6">
            <h2 className="text-[15px] font-bold text-white mb-3">Explore your genres</h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4">
              {EXPLORE.map(e => (
                <button key={e.label+"2"} onClick={()=>setQ(e.label)} className={`w-32 h-32 rounded-lg flex-shrink-0 bg-gradient-to-br ${e.colors} p-3 flex items-end`}><span className="text-sm font-bold text-white">{e.label}</span></button>
              ))}
            </div>
          </section>
          <section className="mt-6">
            <h2 className="text-[15px] font-bold text-white mb-3">Browse all</h2>
            <div className="grid grid-cols-2 gap-3">
              {BROWSE.map(b => (
                <button key={b.title} onClick={()=>setQ(b.title)} className={`${b.color} rounded-lg h-[92px] p-3 text-left relative overflow-hidden`}>
                  <span className="text-[15px] font-bold text-white relative z-10">{b.title}</span>
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-md bg-black/20 rotate-12" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {pickFor && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={()=>setPickFor(null)}>
          <div onClick={e=>e.stopPropagation()} className="bg-[#282828] rounded-t-2xl w-full p-4 max-h-[60vh] overflow-y-auto">
            <p className="font-bold text-white mb-3">Add to playlist</p>
            {playlists.length===0 ? <p className="text-sm text-[#B3B3B3]">No playlists — create one in Library</p> : playlists.map(pl=>(
              <button key={pl.id} onClick={()=>{ const t=pickFor!.thumbnails?.[pickFor!.thumbnails.length-1]?.url||""; add(pl.id, { id: pickFor!.videoId!, title: pickFor!.title, artist: pickFor!.artists?.map(a=>a.name).join(", ")||"", coverUrl: t }); setPickFor(null); }} className="w-full text-left py-3 flex items-center gap-3 border-b border-white/10">
                <span className="text-sm text-white">{pl.title}</span><span className="text-xs text-[#B3B3B3] ml-auto">{pl.songs.length} songs</span>
              </button>
            ))}
            <button onClick={()=>setPickFor(null)} className="w-full mt-3 py-3 bg-white text-black rounded-full font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
