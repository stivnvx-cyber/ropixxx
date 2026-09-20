"use client";
import { useEffect, useState } from "react";
export function Splash() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem("ropixxx-splash-seen") : "1";
    if (seen) { setShow(false); return; }
    setShow(true);
    const t = setTimeout(() => { setShow(false); localStorage.setItem("ropixxx-splash-seen","1"); }, 900);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div onClick={()=>setShow(false)} className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center cursor-pointer">
      <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center shadow-[0_0_40px_rgba(29,185,84,0.4)] animate-pulse">
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-black" fill="currentColor">
          <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm3.74 13.73a.75.75 0 0 1-1.03.25 8.0 8.0 0 0 0-7.42-.02.75.75 0 0 1-.78-1.28 9.5 9.5 0 0 1 8.8.02.75.75 0 0 1 .43 1.03Zm2.02-2.6a.9.9 0 0 1-1.24.3 10.2 10.2 0 0 0-9.46-.02.9.9 0 1 1-.92-1.56 12 12 0 0 1 11.12.02.9.9 0 0 1 .5 1.26Zm.18-2.76a1.05 1.05 0 0 1-1.45.35 12.4 12.4 0 0 0-11.48-.02 1.05 1.05 0 1 1-1.07-1.82A14.5 14.5 0 0 1 17.3 9.4a1.05 1.05 0 0 1 .64 1.47Z" />
        </svg>
      </div>
      <p className="mt-4 text-[10px] tracking-[0.3em] text-white/60 font-semibold">ROPIXXX</p>
      <p className="mt-2 text-[11px] text-white/40">tap to skip</p>
    </div>
  );
}
