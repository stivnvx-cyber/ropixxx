"use client";
import Image from "next/image";
import Link from "next/link";
import { X, Library, Settings } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
export function ProfileDrawer() {
  const { drawerOpen, setDrawerOpen } = useUiStore();
  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setDrawerOpen(false)} />
      <div className={`fixed inset-y-0 left-1/2 z-[61] w-full max-w-[430px] -translate-x-1/2 pointer-events-none`}>
        <div className={`h-full w-[82%] max-w-[320px] bg-[#121212] border-r border-white/10 pointer-events-auto transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <Link href="/account" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 mb-2">
              <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="avatar" width={56} height={56} className="rounded-full object-cover" unoptimized/>
              <div><p className="text-base font-bold">TONY SHARK</p><p className="text-sm text-[#1DB954] font-medium">View profile</p></div>
            </Link>
            <div className="mt-6 space-y-1">
              <Link onClick={() => setDrawerOpen(false)} href="/library" className="flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-white/10 transition-colors"><Library className="w-5 h-5 text-white" /><span className="text-[15px] font-semibold">Your Library</span></Link>
              <Link onClick={() => setDrawerOpen(false)} href="/account" className="flex items-center gap-4 px-3 py-3.5 rounded-xl hover:bg-white/10 transition-colors"><Settings className="w-5 h-5 text-white" /><span className="text-[15px] font-semibold">Settings</span></Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
