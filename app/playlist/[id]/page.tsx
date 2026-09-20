"use client";
import { use, useEffect, useState } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Play, Shuffle, Heart, MoreHorizontal, Clock, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/data/mock";
import { usePlayerStore } from "@/store/playerStore";
import { usePlaylistStore } from "@/store/playlistStore";
export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { playSong, currentSong, isPlaying, togglePlay, toggleFavorite, favorites } = usePlayerStore();
  const { playlists, remove } = usePlaylistStore();
  const local = playlists.find(p=>p.id===id);
  const [yt, setYt] = useState<{title:string;thumbnails?:{url:string}[];tracks?:{videoId:string;title:string;artists?:{name:string}[];thumbnails?:{url:string}[];duration?:string}[];description?:string}|null>(null);
  const [loading, setLoading] = useState(!local);
  useEffect(()=>{
    if (local) return;
    fetch(`/api/yt/playlist/${id}`).then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(d=>{ if(d?.tracks||d?.title) setYt(d); }).catch(()=>{}).finally(()=>setLoading(false));
  },[id, local]);
  if (local) {
    const songs = local.songs.map(s=>({ id:s.id, title:s.title, artist:s.artist, album:"", coverUrl:s.coverUrl, audioUrl:"", duration:0 }));
    const isFav = favorites.includes(local.id);
    return (
      <div className="pb-8">
        <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-[#3a3a3a] to-[#121212]">
          <div className="flex gap-6 items-end">
            <div className="w-32 h-32 rounded-md bg-[#282828] overflow-hidden flex-shrink-0 relative">{local.coverUrl ? <Image src={local.coverUrl} alt={local.title} fill className="object-cover" unoptimized/> : null}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-bold tracking-widest text-white/70">PLAYLIST</p><h1 className="text-2xl font-black text-white leading-tight">{local.title}</h1><p className="text-xs text-[#B3B3B3]">{local.songs.length} songs</p></div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4">
          <button onClick={()=>{ if(!songs.length) return; playSong(songs[0] as never, songs as never); }} className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center press"><Play className="w-6 h-6 fill-black text-black ml-0.5"/></button>
          <button onClick={()=>toggleFavorite(local.id)} className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${isFav?"text-[#1DB954]":"text-white"}`}><Heart className={`w-6 h-6 ${isFav?"fill-current":""}`}/></button>
        </div>
        <div className="px-4 space-y-1">
          {songs.length===0 ? <p className="text-sm text-[#B3B3B3] px-2 py-8 text-center">Empty — add songs from Search (+) </p> : songs.map((s,idx)=>(
            <div key={s.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 group">
              <button onClick={()=>{ const cur=currentSong?.id===s.id; if(cur){ togglePlay(); return; } playSong(s as never, songs as never); }} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <span className="w-6 text-center text-xs text-[#B3B3B3]">{idx+1}</span>
                <div className="relative w-10 h-10 rounded overflow-hidden bg-[#282828] flex-shrink-0">{s.coverUrl ? <Image src={s.coverUrl} alt={s.title} fill className="object-cover" sizes="40px" unoptimized/> : null}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{s.title}</p><p className="text-xs text-[#B3B3B3] truncate">{s.artist}</p></div>
              </button>
              <button onClick={()=>remove(local.id, s.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/40"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (loading) return <div className="p-8 text-sm text-[#B3B3B3]">Loading…</div>;
  if (!yt) return notFound();
  const tracks = (yt.tracks||[]).filter(t=>t.videoId);
  return (
    <div className="pb-8">
      <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-[#3a3a3a] to-[#121212]">
        <div className="flex gap-6 items-end">
          <div className="w-32 h-32 rounded-md bg-[#282828] overflow-hidden flex-shrink-0 relative">{yt.thumbnails?.[0] ? <Image src={yt.thumbnails[yt.thumbnails.length-1].url} alt={yt.title} fill className="object-cover" unoptimized/> : null}</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-bold tracking-widest text-white/70">PLAYLIST</p><h1 className="text-2xl font-black text-white leading-tight">{yt.title}</h1><p className="text-xs text-[#B3B3B3] line-clamp-2">{yt.description||""}</p><p className="text-xs text-[#B3B3B3]">{tracks.length} songs</p></div>
        </div>
      </div>
      <div className="flex gap-3 px-6 py-4">
        <button onClick={()=>{ if(!tracks.length) return; const s=tracks[0]; playSong({ id:s.videoId, title:s.title, artist:s.artists?.map(a=>a.name).join(", ")||"", album:"", coverUrl:s.thumbnails?.[s.thumbnails.length-1]?.url||"", audioUrl:"", duration:0 } as never, [] as never); }} className="w-14 h-14 rounded-full bg-[#1DB954] flex items-center justify-center"><Play className="w-6 h-6 fill-black text-black ml-0.5"/></button>
        <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white"><Shuffle className="w-5 h-5"/></button>
      </div>
      <div className="px-2 space-y-1">
        {tracks.map((t,idx)=>(
          <button key={t.videoId+idx} onClick={()=>{ if(currentSong?.id===t.videoId){ togglePlay(); return; } playSong({ id:t.videoId, title:t.title, artist:t.artists?.map(a=>a.name).join(", ")||"", album:"", coverUrl:t.thumbnails?.[t.thumbnails.length-1]?.url||"", audioUrl:"", duration:0 } as never, [] as never); }} className="flex items-center gap-3 w-full text-left px-2 py-2 rounded-md hover:bg-white/10">
            <span className="w-6 text-center text-xs text-[#B3B3B3]">{idx+1}</span>
            <div className="relative w-10 h-10 rounded overflow-hidden bg-[#282828] flex-shrink-0">{t.thumbnails?.[0] ? <Image src={t.thumbnails[t.thumbnails.length-1].url} alt={t.title} fill className="object-cover" sizes="40px" unoptimized/> : null}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{t.title}</p><p className="text-xs text-[#B3B3B3] truncate">{t.artists?.map(a=>a.name).join(", ")}</p></div>
            <span className="text-xs text-[#B3B3B3]">{t.duration||""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
