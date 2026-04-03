import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-[#2c2a26] mb-4">MenuSnap</h1>
      <p className="text-lg text-[#6b6560] max-w-md mb-10">
        Beautiful digital menus for restaurants. Set up in minutes, update in seconds.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/signup" className="px-8 py-3 rounded-xl bg-[#8b6914] text-white font-medium text-lg hover:opacity-90 transition-opacity">
          Get started free
        </Link>
        <Link href="/login" className="px-8 py-3 rounded-xl border border-[#2c2a26]/20 text-[#2c2a26] font-medium text-lg hover:bg-[#2c2a26]/5 transition-colors">
          Sign in
        </Link>
      </div>
    </main>
  );
}
