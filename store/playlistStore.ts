"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
export type PlSong = { id: string; title: string; artist: string; coverUrl: string; audioUrl?: string };
export type Playlist = { id: string; title: string; songs: PlSong[]; coverUrl?: string };
interface S { playlists: Playlist[]; create: (title: string)=>string; add: (pid: string, s: PlSong)=>void; remove: (pid: string, sid: string)=>void; delete: (pid:string)=>void; }
export const usePlaylistStore = create<S>()(persist((set,get)=>({
  playlists: [],
  create: (title) => { const id="pl_"+Date.now(); set(s=>({ playlists: [...s.playlists, { id, title, songs: [] }] })); return id; },
  add: (pid, song) => set(s=>({ playlists: s.playlists.map(p=> p.id===pid && !p.songs.some(x=>x.id===song.id) ? { ...p, songs: [...p.songs, song], coverUrl: p.coverUrl||song.coverUrl } : p )})),
  remove: (pid,sid) => set(s=>({ playlists: s.playlists.map(p=> p.id===pid ? { ...p, songs: p.songs.filter(x=>x.id!==sid) } : p )})),
  delete: (pid) => set(s=>({ playlists: s.playlists.filter(p=>p.id!==pid )})),
}), { name: "ropixxx-playlists" }));
