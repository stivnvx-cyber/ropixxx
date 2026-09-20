"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { useUiStore } from "@/store/uiStore";
import { USER } from "@/lib/data/spotify";
type Filter = "All" | "Music" | "Podcasts";
type YtSong = { videoId: string; title: string; artists?: { name: string }[]; thumbnails?: { url: string }[]; duration_seconds?: number };
type Mood = { title: string; playlistId: string; thumbnails?: { url: string }[] }[];
export default function HomePage() {
  const [filter, setFilter] = useState<Filter>("Music");
  const [songs, setSongs] = useState<YtSong[]>([]);
  const [mood, setMood] = useState<Mood>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { playSong } = usePlayerStore();
  useEffect(() => {
    fetch("/api/yt/home").then(r=>{ if(!r.ok) throw new Error("home failed"); return r.json(); }).then(d=>{
      const list = (d.trending || []).filter((x:YtSong)=>x.videoId);
      if (!list.length) setErr("No trending right now — try Search");
      setSongs(list);
      const m: Mood = (d.mood || []).flatMap((g:{playlists: Mood})=>g.playlists || []).slice(0,8);
      setMood(m);
    }).catch(()=>setErr("Failed to load — is yt-api running?")).finally(()=>setLoading(false));
  }, []);
  async function playYt(s: YtSong, queue: YtSong[] = songs) {
    const st = await fetch(`/api/yt/stream/${s.videoId}`).then(r=>r.json()).catch(()=>null);
    const url = st?.url || "";
    const thumb = s.thumbnails?.[s.thumbnails.length-1]?.url || st?.thumbnail || "";
    const artist = s.artists?.map(a=>a.name).join(", ") || "Unknown";
    const q = queue.map(x=>({ id: x.videoId, title: x.title, artist: x.artists?.map(a=>a.name).join(", ")||"", album:"", coverUrl: x.thumbnails?.[x.thumbnails.length-1]?.url||"", audioUrl: x.videoId===s.videoId?url:"", duration: x.duration_seconds||0 }));
    const base = { ...q.find(x=>x.id===s.videoId)!, coverUrl: thumb || q.find(x=>x.id===s.videoId)!.coverUrl, artist } as never;
    playSong(base, q as never);
    fetch(`/api/yt/lyrics/${s.videoId}`).then(r=>r.json()).then(d=>{
      if (d?.hasTimestamps && Array.isArray(d.lyrics)) {
        const lyrics = d.lyrics.map((l:{text:string;start_time?:number})=>({ time: (l.start_time||0)/1000, text: l.text }));
        usePlayerStore.setState({ currentSong: { ...(usePlayerStore.getState().currentSong as object), lyrics } as never });
      } else if (typeof d?.lyrics === "string" && d.lyrics.trim()) {
        const lyrics = d.lyrics.split("\n").filter(Boolean).map((t:string,i:number)=>({ time: i*3, text: t }));
        usePlayerStore.setState({ currentSong: { ...(usePlayerStore.getState().currentSong as object), lyrics } as never });
      } else {
        usePlayerStore.setState({ currentSong: { ...(usePlayerStore.getState().currentSong as object), lyrics: [{ time: 0, text: "No synced lyrics — plain lyrics not available." }] } as never });
      }
    }).catch(()=>{});
  }
  if (loading) return <div className="px-2 mt-3 space-y-3"><div className="grid grid-cols-2 gap-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-14 shimmer rounded-[4px]"/> )}</div><div className="px-2"><div className="h-24 shimmer rounded-lg"/></div><div className="flex gap-3 px-2">{Array.from({length:3}).map((_,i)=><div key={i} className="w-36 h-36 shimmer rounded-md"/> )}</div></div>;
  if (filter==="Podcasts") {
    return (
      <div className="pb-2">
        <Header filter={filter} setFilter={setFilter}/>
        <div className="px-4 mt-4">
          <h2 className="text-lg font-bold text-white mb-3">Trending podcasts</h2>
          <p className="text-sm text-[#B3B3B3]">Search podcasts in Search tab.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="pb-2">
      <Header filter={filter} setFilter={setFilter}/>
      <div className="px-2 mt-3">
        <div className="grid grid-cols-2 gap-2">
          {songs.slice(0,6).map((s)=>(
            <button key={s.videoId} onClick={()=>playYt(s)} className="flex items-center gap-3 bg-[#2A2A2A] rounded-[4px] overflow-hidden text-left h-14 press transition-transform active:bg-[#3a3a3a]">
              <div className="relative w-14 h-14 flex-shrink-0 bg-[#181818]">{s.thumbnails?.[0] ? <Image src={s.thumbnails[s.thumbnails.length-1].url} alt={s.title} fill className="object-cover" sizes="56px" unoptimized/> : null}</div>
              <span className="text-[13px] font-bold text-white pr-2 line-clamp-2 leading-tight">{s.title}</span>
            </button>
          ))}
        </div>
      </div>
      {err && <div className="mx-2 mt-3 bg-[#282828] rounded-lg p-4 flex items-center justify-between"><p className="text-sm text-[#B3B3B3]">{err}</p><button onClick={()=>location.reload()} className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold press">Retry</button></div>}
      {songs.length>0 && (
        <section className="mt-6 px-4">
          <button onClick={()=>playYt(songs[0])} className="w-full bg-[#181818] rounded-lg overflow-hidden flex gap-3 p-2 text-left press active:bg-[#282828] transition-colors">
            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-[#282828]">{songs[0].thumbnails?.[0] ? <Image src={songs[0].thumbnails![songs[0].thumbnails!.length-1].url} alt={songs[0].title} fill className="object-cover" sizes="80px" unoptimized/> : null}</div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-sm font-bold text-white line-clamp-1">{songs[0].title}</p>
              <p className="text-xs text-[#B3B3B3] line-clamp-1">{songs[0].artists?.map(a=>a.name).join(", ")}</p>
            </div>
            <span className="self-center w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg flex-shrink-0"><Play className="w-5 h-5 fill-black text-black ml-0.5"/></span>
          </button>
        </section>
      )}
      {mood.length>0 && (
        <section className="mt-6">
          <div className="px-4 flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-white">Mood & Genres</h2></div>
          <div className="flex gap-3 overflow-x-auto pb-2 px-4 snap-x">
            {mood.map((m)=>(
              <div key={m.playlistId} className="w-[148px] flex-shrink-0 snap-start">
                <div className="relative w-[148px] h-[148px] rounded-lg overflow-hidden bg-[#282828]">{m.thumbnails?.[0] ? <Image src={m.thumbnails[m.thumbnails.length-1].url} alt={m.title} fill className="object-cover" sizes="148px" unoptimized/> : null}</div>
                <p className="text-sm font-semibold text-white mt-2 truncate">{m.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="mt-6">
        <div className="px-4 flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-white">Trending Now</h2></div>
        <div className="flex gap-3 overflow-x-auto px-4 snap-x pb-2">
          {songs.map((s)=>(
            <button key={s.videoId+"t"} onClick={()=>playYt(s)} className="w-36 flex-shrink-0 snap-start text-left">
              <div className="relative w-36 h-36 rounded-md overflow-hidden bg-[#181818]">{s.thumbnails?.[0] ? <Image src={s.thumbnails[s.thumbnails.length-1].url} alt={s.title} fill className="object-cover" sizes="144px" unoptimized/> : null}</div>
              <p className="text-sm font-semibold text-white truncate mt-1.5">{s.title}</p>
              <p className="text-xs text-[#B3B3B3] truncate">{s.artists?.map(a=>a.name).join(", ")}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
function Header({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter)=>void }) {
  const { setDrawerOpen } = useUiStore();
  return (
    <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur supports-[backdrop-filter]:bg-[#121212]/80">
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <button onClick={()=>setDrawerOpen(true)} aria-label="Open menu" className="min-w-[44px] min-h-[44px] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
          <Image src={USER.avatar} alt={USER.name} width={32} height={32} className="object-cover w-8 h-8 rounded-full" unoptimized/>
        </button>
        <div className="flex gap-2">
          {(["All","Music","Podcasts"] as Filter[]).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors min-h-[32px] ${filter===f?"bg-[#1DB954] text-black":"bg-[#2A2A2A] text-white"}`}>{f}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
