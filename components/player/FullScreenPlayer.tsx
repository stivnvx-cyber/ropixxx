"use client";
import { useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart, MoreHorizontal, Music2 } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/data/mock";
export function FullScreenPlayer() {
  const { currentSong, isPlaying, currentTime, duration, volume, isShuffled, repeatMode, favorites, showFullPlayer, togglePlay, seek, nextSong, prevSong, setVolume, toggleShuffle, toggleRepeat, setShowFullPlayer, toggleFavorite } = usePlayerStore();
  const lyricsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!currentSong?.lyrics || !lyricsRef.current) return;
    const active = lyricsRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentTime, currentSong]);
  useEffect(() => {
    if (!currentSong || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({ title: currentSong.title, artist: currentSong.artist, album: currentSong.album || "Ropixxx", artwork: currentSong.coverUrl ? [{ src: currentSong.coverUrl, sizes: "512x512", type: "image/jpeg" }] : [] });
      navigator.mediaSession.setActionHandler("play", () => togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => togglePlay());
      navigator.mediaSession.setActionHandler("nexttrack", () => nextSong());
      navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());
    } catch {}
  }, [currentSong, togglePlay, nextSong, prevSong]);
  if (!showFullPlayer || !currentSong) return null;
  const isFav = favorites.includes(currentSong.id);
  const activeLyricIdx = currentSong.lyrics ? currentSong.lyrics.reduce((acc, l, i) => (l.time <= currentTime ? i : acc), -1) : -1;
  return (
    <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <button onClick={() => setShowFullPlayer(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-white"><ChevronDown className="w-6 h-6" /></button>
        <p className="text-xs font-bold tracking-widest text-white">PLAYING FROM PLAYLIST</p>
        <button className="w-9 h-9 rounded-full flex items-center justify-center text-white"><MoreHorizontal className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 flex flex-col items-center px-6 overflow-y-auto">
        <div className="w-[86vw] max-w-[320px] aspect-square rounded-lg overflow-hidden shadow-2xl mt-2"><Image src={currentSong.coverUrl} alt={currentSong.title} width={640} height={640} className="object-cover w-full h-full" /></div>
        <div className="w-full max-w-[320px] flex items-start justify-between mt-6">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold text-white truncate">{currentSong.title}</h2>
            <p className="text-[15px] text-[#B3B3B3] truncate">{currentSong.artist}</p>
          </div>
          <button onClick={() => toggleFavorite(currentSong.id)} className={`p-2 flex-shrink-0 ${isFav ? "text-[#1DB954]" : "text-white"}`}><Heart className={`w-6 h-6 ${isFav ? "fill-current" : ""}`} /></button>
        </div>
        <div className="w-full max-w-[320px] mt-6">
          <Slider value={[currentTime]} max={duration || 1} step={1} onValueChange={(v) => seek(Array.isArray(v) ? v[0] : v)} className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white" />
          <div className="flex justify-between mt-1"><span className="text-[11px] text-[#B3B3B3]">{formatDuration(currentTime)}</span><span className="text-[11px] text-[#B3B3B3]">{formatDuration(duration)}</span></div>
        </div>
        <div className="w-full max-w-[360px] flex items-center justify-between mt-4">
          <button onClick={toggleShuffle} className={`p-2 ${isShuffled ? "text-[#1DB954]" : "text-white"}`}><Shuffle className="w-5 h-5" /></button>
          <button onClick={prevSong} className="p-2 text-white"><SkipBack className="w-7 h-7 fill-white" /></button>
          <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-lg">{isPlaying ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-0.5" />}</button>
          <button onClick={nextSong} className="p-2 text-white"><SkipForward className="w-7 h-7 fill-white" /></button>
          <button onClick={toggleRepeat} className={`p-2 ${repeatMode !== "none" ? "text-[#1DB954]" : "text-white"}`}>{repeatMode === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}</button>
        </div>
        <div ref={lyricsRef} className="w-full max-w-[430px] mt-8 pb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Music2 className="w-4 h-4 text-white" /><span className="text-sm font-bold text-white">Lyrics</span></div>
              <span className="text-xs text-[#B3B3B3]">Preview</span>
            </div>
            <div className="space-y-1 max-h-[32vh] overflow-y-auto pr-1">
              {currentSong.lyrics?.map((line, i) => (
                <button key={i} data-active={i === activeLyricIdx} onClick={() => seek(line.time)} className={`block w-full text-left px-2 py-1 rounded-md text-sm leading-6 transition-colors ${i === activeLyricIdx ? "bg-white text-black font-semibold" : i < activeLyricIdx ? "text-white/40" : "text-white"}`}>{line.text}</button>
              )) ?? <p className="text-sm text-white/50">No lyrics</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
