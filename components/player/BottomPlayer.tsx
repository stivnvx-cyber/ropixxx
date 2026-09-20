"use client";
import Image from "next/image";
import { Play, Pause, Heart, MonitorSpeaker } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
export function BottomPlayer() {
  const { currentSong, isPlaying, currentTime, duration, favorites, togglePlay, setShowFullPlayer, toggleFavorite } = usePlayerStore();
  if (!currentSong) return null;
  const isFav = favorites.includes(currentSong.id);
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="mx-2 mb-1">
      <div className="bg-[#535353]/90 backdrop-blur rounded-lg overflow-hidden shadow-xl">
        <div className="flex items-center gap-3 w-full px-2 py-2">
          <button onClick={() => setShowFullPlayer(true)} aria-label="Open player" className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="relative w-10 h-10 rounded-[4px] overflow-hidden flex-shrink-0"><Image src={currentSong.coverUrl} alt={currentSong.title} fill className="object-cover" sizes="40px" /></div>
            <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-white truncate">{currentSong.title}</p><p className="text-[11px] text-white/70 truncate">{currentSong.artist}</p></div>
          </button>
          <div className="flex items-center gap-1 pr-1">
            <button onClick={() => toggleFavorite(currentSong.id)} aria-label={isFav ? "Remove favorite" : "Add favorite"} className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${isFav ? "text-[#1DB954]" : "text-white"}`}><Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} /></button>
            <span className="hidden sm:inline-flex min-w-[44px] min-h-[44px] items-center justify-center text-white/70"><MonitorSpeaker className="w-4 h-4" /></span>
            <button onClick={() => togglePlay()} aria-label={isPlaying ? "Pause" : "Play"} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white">{isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}</button>
          </div>
        </div>
        <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className="h-[2px] bg-white/20"><div className="h-full bg-white transition-all" style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  );
}
