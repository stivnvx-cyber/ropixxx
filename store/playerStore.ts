import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Howl as HowlType } from "howler";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  lyrics?: { time: number; text: string }[];
}

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
  showFullPlayer: boolean;
  howl: HowlType | null;
  favorites: string[];
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setShowFullPlayer: (show: boolean) => void;
  toggleFavorite: (id: string) => void;
  setCurrentTime: (time: number) => void;
}

let howlInstance: HowlType | null = null;
let rafId: number | null = null;

function stopRaf() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      queue: [],
      isShuffled: false,
      repeatMode: "none",
      showFullPlayer: false,
      howl: null,
      favorites: [],

  playSong: async (song: Song, queue?: Song[]) => {
    if (typeof window === "undefined") return;
    stopRaf();
    if (howlInstance) {
      howlInstance.stop();
      howlInstance.unload();
    }

    const newQueue = queue ?? get().queue;
    set({ currentSong: song, queue: newQueue, currentTime: 0, duration: song.duration });
    if (newQueue.length > 1) {
      const idx = newQueue.findIndex((s) => s.id === song.id);
      newQueue.slice(idx + 1, idx + 4).forEach(async (ns) => {
        if (!ns.audioUrl) {
          try {
            const r = await fetch(`/api/yt/stream/${ns.id}`);
            const j = await r.json();
            if (j?.url) {
              const q = get().queue;
              const t = q.find((x) => x.id === ns.id) as unknown as { audioUrl: string } | undefined;
              if (t) t.audioUrl = j.url;
            }
          } catch {}
        }
      });
    }

    const { Howl } = await import("howler");

    let src = song.audioUrl;
    if (!src) {
      try {
        const r = await fetch(`/api/yt/stream/${song.id}`);
        const j = await r.json();
        if (j?.url) {
          src = j.url;
          const cur = get().currentSong;
          if (cur && cur.id === song.id) set({ currentSong: { ...cur, audioUrl: src } });
          const q = get().queue;
          const t = q.find((x) => x.id === song.id) as unknown as { audioUrl: string } | undefined;
          if (t) t.audioUrl = src;
        }
      } catch {}
    }
    if (!src) {
      console.warn("No audio url for", song.id);
      setTimeout(() => get().nextSong(), 800);
      return;
    }
    const ext = src.split("?")[0].split(".").pop()?.toLowerCase();
    const fmt = ext === "webm" ? ["webm"] : ext === "mp4" ? ["mp4"] : ["m4a", "mp3"];
    howlInstance = new Howl({
      src: [src],
      html5: true,
      preload: "metadata",
      format: fmt,
      volume: get().volume,
      onload: () => {
        const d = howlInstance?.duration();
        if (d && isFinite(d) && d > 0) set({ duration: d });
      },
      onplay: () => {
        const d = howlInstance?.duration();
        set({ isPlaying: true, ...(d && isFinite(d) && d > 0 ? { duration: d } : {}) });
        const tick = () => {
          if (howlInstance?.playing()) {
            set({ currentTime: howlInstance.seek() as number });
            rafId = requestAnimationFrame(tick);
          }
        };
        rafId = requestAnimationFrame(tick);
      },
      onpause: () => set({ isPlaying: false }),
      onstop: () => { set({ isPlaying: false, currentTime: 0 }); stopRaf(); },
      onend: async () => {
        stopRaf();
        const { repeatMode, queue: q, currentSong: cs } = get();
        if (repeatMode === "one") {
          howlInstance?.seek(0);
          howlInstance?.play();
          return;
        }
        const idx = q.findIndex((s) => s.id === cs?.id);
        const hasNext = idx >= 0 && idx < q.length - 1;
        if (hasNext || repeatMode === "all") {
          get().nextSong();
          return;
        }
        if (cs) {
          try {
            const r = await fetch(`/api/yt/watch/${cs.id}`);
            const w = await r.json();
            const tracks: { videoId: string; title: string; artists?: { name: string }[]; thumbnails?: { url: string }[] }[] = w.tracks || [];
            const nxt = tracks.find((t) => t.videoId && t.videoId !== cs.id);
            if (nxt?.videoId) {
              const sr = await fetch(`/api/yt/stream/${nxt.videoId}`).then((x) => x.json()).catch(() => null);
              const url2 = sr?.url;
              if (url2) {
                const thumb = nxt.thumbnails?.[nxt.thumbnails.length - 1]?.url || "";
                const nxtSong = { id: nxt.videoId, title: nxt.title, artist: nxt.artists?.map((a) => a.name).join(", ") || "", album: "", coverUrl: thumb, audioUrl: url2, duration: 0 } as Song;
                const more = tracks.slice(0, 8).filter((t) => t.videoId && t.videoId !== nxt.videoId).map((t) => ({ id: t.videoId, title: t.title, artist: t.artists?.map((a) => a.name).join(", ") || "", album: "", coverUrl: t.thumbnails?.[t.thumbnails.length - 1]?.url || "", audioUrl: "", duration: 0 } as Song));
                get().playSong(nxtSong, [nxtSong, ...more]);
                return;
              }
            }
          } catch {}
        }
      },
      onloaderror: (_id, err) => {
        console.warn("Audio load error", err);
        setTimeout(() => get().nextSong(), 700);
      },
      onplayerror: (_id, err) => {
        console.warn("Audio play error", err);
        setTimeout(() => get().nextSong(), 700);
      },
    });

    try {
      howlInstance.play();
    } catch (e) {
      console.warn("Autoplay blocked", e);
      set({ isPlaying: false });
    }
  },

  togglePlay: () => {
    if (!howlInstance) return;
    try {
      if (howlInstance.playing()) {
        howlInstance.pause();
        stopRaf();
        set({ isPlaying: false });
      } else {
        const id = howlInstance.play() as unknown;
        if (id === undefined) set({ isPlaying: false });
        else set({ isPlaying: true });
      }
    } catch {
      set({ isPlaying: false });
    }
  },

  seek: (time) => {
    if (howlInstance) {
      howlInstance.seek(time);
      set({ currentTime: time });
    }
  },

  nextSong: () => {
    const { queue, currentSong, isShuffled, repeatMode } = get();
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    let nextIdx: number;
    if (isShuffled) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (idx === queue.length - 1) {
      if (repeatMode === "all") nextIdx = 0;
      else return;
    } else {
      nextIdx = idx + 1;
    }
    get().playSong(queue[nextIdx], queue);
  },

  prevSong: () => {
    const { queue, currentSong, currentTime } = get();
    if (!currentSong) return;
    if (currentTime > 3) { get().seek(0); return; }
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    const prevIdx = idx <= 0 ? 0 : idx - 1;
    get().playSong(queue[prevIdx], queue);
  },

  setVolume: (volume) => {
    if (howlInstance) howlInstance.volume(volume);
    set({ volume });
  },

  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  toggleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === "none" ? "all" : s.repeatMode === "all" ? "one" : "none",
    })),

  setShowFullPlayer: (show) => set({ showFullPlayer: show }),

  toggleFavorite: (id) =>
    set((s) => ({
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((f) => f !== id)
        : [...s.favorites, id],
    })),

  setCurrentTime: (time) => set({ currentTime: time }),
    }),
    {
      name: "ropixxx-player",
      partialize: (s) => ({ favorites: s.favorites, volume: s.volume, queue: s.queue }),
      version: 1,
    }
  )
);
