"use client";
import { User, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/playerStore";
import { usePlaylistStore } from "@/store/playlistStore";
export default function AccountPage() {
  const { volume, setVolume, favorites } = usePlayerStore();
  const { playlists } = usePlaylistStore();
  return (
    <div className="px-4 py-6 max-w-[430px] mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Account</h1>
      <div className="bg-[#181818] rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#282828] flex items-center justify-center flex-shrink-0"><User className="w-7 h-7 text-white" /></div>
        <div><p className="font-bold text-white">TONY SHARK</p><p className="text-sm text-[#B3B3B3]">@tonyshark</p><p className="text-xs text-[#535353]">{playlists.length} playlists • {favorites.length} likes</p></div>
      </div>
      <div className="bg-[#181818] rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3"><Volume2 className="w-5 h-5 text-white" /><span className="text-sm font-bold text-white">Volume</span></div>
        <div className="flex items-center gap-3">
          <Slider value={[volume*100]} max={100} step={1} onValueChange={(v)=>setVolume((Array.isArray(v)?v[0]:v)/100)} className="flex-1" />
          <span className="text-xs text-[#B3B3B3] w-8 text-right">{Math.round(volume*100)}%</span>
        </div>
      </div>
      <p className="text-xs text-[#535353] text-center mt-6">Ropixxx • YT Music API • All data real</p>
    </div>
  );
}
