"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Library, User } from "lucide-react";
const ITEMS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/library", label: "Your Library", Icon: Library },
  { href: "/account", label: "Account", Icon: User },
];
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-gradient-to-t from-black to-[#121212] border-t border-white/10 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:pb-2">
      <div className="flex items-center justify-around max-w-[430px] mx-auto">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} aria-label={label} className={`flex flex-col items-center gap-1 px-4 py-1 min-w-[44px] min-h-[44px] justify-center ${active ? "text-white" : "text-[#B3B3B3]"}`}>
              <Icon className={`w-[22px] h-[22px] ${active ? "fill-white" : ""}`} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
export function AvatarButton() {
  return null;
}
