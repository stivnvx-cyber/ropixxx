import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <p className="text-6xl font-black text-white/10">404</p>
      <p className="text-white font-bold mt-2">Page not found</p>
      <p className="text-sm text-[#B3B3B3] mt-1">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="mt-6 px-6 py-3 bg-white text-black rounded-full text-sm font-bold press">Go home</Link>
    </div>
  );
}
