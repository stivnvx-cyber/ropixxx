"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Pin, Search, Plus, ArrowUpDown, Grid2X2, List, Trash2 } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { usePlaylistStore } from "@/store/playlistStore";
type Filter = "All" | "Playlists" | "Artists";
export default function LibraryPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const [view, setView] = useState<"list" | "grid">("list");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [q, setQ] = useState("");
  const { favorites } = usePlayerStore();
  const { playlists, create, delete: delPl } = usePlaylistStore();
  const filtered = playlists.filter(p=> p.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-white">Your Library</h1>
        <div className="flex gap-1">
          <Link href="/search" aria-label="Search" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B3B3B3]"><Search className="w-5 h-5" /></Link>
          <button onClick={()=>setShowCreate(true)} aria-label="Create playlist" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B3B3B3]"><Plus className="w-6 h-6" /></button>
        </div>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-[#282828] rounded-xl p-4 w-full max-w-sm">
            <h3 className="font-bold text-white mb-3">New playlist</h3>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Playlist name" className="w-full bg-[#3a3a3a] text-white rounded px-3 py-2 text-base outline-none" autoFocus/>
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={()=>setShowCreate(false)} className="px-4 py-2 text-sm text-white">Cancel</button>
              <button onClick={()=>{ if(newTitle.trim()){ create(newTitle.trim()); setNewTitle(""); setShowCreate(false);} }} className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold">Create</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter playlists" className="flex-1 bg-[#282828] text-white placeholder:text-[#535353] rounded-full px-4 py-2 text-sm outline-none" />
      </div>
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-none">
        {(["All", "Playlists"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`min-h-[32px] px-3 rounded-full text-[13px] font-semibold whitespace-nowrap press ${filter === f ? "bg-white text-black" : "bg-[#2A2A2A] text-white"}`}>{f}</button>
        ))}
      </div>
      <div className="flex items-center justify-between py-2">
        <span className="flex items-center gap-1 text-xs text-[#B3B3B3]"><ArrowUpDown className="w-3.5 h-3.5" />{filtered.length} playlists</span>
        <button onClick={() => setView((v) => (v === "list" ? "grid" : "list"))} aria-label="Toggle view" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B3B3B3] press">{view === "list" ? <Grid2X2 className="w-4 h-4" /> : <List className="w-4 h-4" />}</button>
      </div>
      <div className={view === "grid" ? "grid grid-cols-2 gap-3" : "space-y-1"}>
        <div className={`flex items-center gap-3 p-2 rounded-md hover:bg-white/10 ${view === "grid" ? "flex-col text-center" : ""}`}>
          <div className={`${view === "grid" ? "w-32 h-32" : "w-12 h-12"} rounded-md bg-gradient-to-br from-indigo-700 to-emerald-400 flex items-center justify-center flex-shrink-0`}><Heart className="w-6 h-6 fill-white text-white" /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">Liked Songs</p><p className="text-xs text-[#B3B3B3] truncate">Playlist • {favorites.length} songs</p></div><Pin className="w-4 h-4 text-[#1DB954] rotate-45 flex-shrink-0" />
        </div>
        {filtered.length===0 && <p className="text-sm text-[#B3B3B3] px-2 py-4">{q ? `No match for "${q}"` : "No playlists yet — tap + to create"}</p>}
        {view === "list" ? (
          <>
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white/10">
                <Link href={`/playlist/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#282828]">{p.coverUrl ? <Image src={p.coverUrl} alt={p.title} fill className="object-cover" sizes="48px" unoptimized/> : null}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{p.title}</p><p className="text-xs text-[#B3B3B3] truncate">Playlist • {p.songs.length} songs</p></div>
                </Link>
                <button onClick={()=>delPl(p.id)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/50"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </>
        ) : (
          <>
            {filtered.map((p) => (
              <Link key={p.id} href={`/playlist/${p.id}`} className="bg-[#181818] rounded-lg overflow-hidden press">
                <div className="relative aspect-square bg-[#282828]">{p.coverUrl ? <Image src={p.coverUrl} alt={p.title} fill className="object-cover" sizes="160px" unoptimized/> : null}</div>
                <p className="text-xs font-semibold text-white truncate p-2">{p.title}</p>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
