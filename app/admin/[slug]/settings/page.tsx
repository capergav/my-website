import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { AccountDangerZone } from "../AccountDangerZone";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/${slug}/settings`);

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: "#faf8f5" }}>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <a
            href={`/admin/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#6b6560] hover:text-[#2c2a26] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </a>
          <h1 className="text-2xl font-serif font-semibold text-[#2c2a26]">Account Settings</h1>
          <p className="text-sm text-[#6b6560] mt-1">{user.email}</p>
        </div>

        <AccountDangerZone />
      </div>
    </main>
  );
}
