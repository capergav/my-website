export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyToken, signToken, EDIT_TTL_MS } from "@/lib/mapTokens";
import { MapEditForm, type MapFields } from "../MapEditForm";

export const metadata: Metadata = {
  title: "Approve for map",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf8f5] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <span className="text-xl">
            <span style={{ fontFamily: "Georgia, serif", color: "#2c2a26", fontWeight: 400 }}>Dine</span>
            <span style={{ fontFamily: "Georgia, serif", color: "#8b6914", fontWeight: 700 }}>Links</span>
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}

function ErrorCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Shell>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">{detail}</p>
        <Link href="/map/admin" className="text-sm font-medium text-[#8b6914] hover:underline">
          Open the map admin instead
        </Link>
      </div>
    </Shell>
  );
}

function toFields(r: Record<string, unknown>): MapFields {
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    map_name: s(r.map_name),
    address: s(r.address),
    city: s(r.city),
    province: s(r.province),
    country: s(r.country),
    latitude: r.latitude == null ? "" : String(r.latitude),
    longitude: r.longitude == null ? "" : String(r.longitude),
    map_notes: s(r.map_notes),
    approved_for_map: !!r.approved_for_map,
  };
}

export default async function ApprovePage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) return <ErrorCard title="Missing token" detail="This approval link is incomplete." />;

  const payload = verifyToken(token, "approve");
  if (!payload) {
    return (
      <ErrorCard
        title="Link expired or invalid"
        detail="This approval link is no longer valid. It may have expired (links last 30 days)."
      />
    );
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select(
      "id, slug, name, map_name, address, city, province, country, latitude, longitude, map_notes, approved_for_map, map_approval_nonce"
    )
    .eq("id", payload.rid)
    .maybeSingle();

  if (!restaurant) {
    return <ErrorCard title="Restaurant not found" detail="This restaurant no longer exists." />;
  }

  // Single-use nonce check. A fresh click consumes the nonce. A valid-signature
  // link whose nonce was already consumed is accepted only if the restaurant is
  // already approved — this keeps double-clicks and email link-scanners from
  // showing a scary error while still refusing truly forged/replayed tokens.
  const nonceMatches = !!payload.n && payload.n === (restaurant as { map_approval_nonce?: string }).map_approval_nonce;
  const alreadyApproved = !!(restaurant as { approved_for_map?: boolean }).approved_for_map;

  if (!nonceMatches && !alreadyApproved) {
    return (
      <ErrorCard
        title="Link already used"
        detail="This approval link has already been used. Head to the map admin to make changes."
      />
    );
  }

  if (nonceMatches) {
    await supabaseAdmin
      .from("restaurants")
      .update({ approved_for_map: true, map_approval_nonce: null })
      .eq("id", restaurant.id);
  }

  const fields = toFields(restaurant as Record<string, unknown>);
  fields.approved_for_map = true; // reflect the approval we just performed

  // Short-lived edit capability so the (logged-out) founder can save edits.
  const editToken = signToken({
    purpose: "edit",
    restaurantId: restaurant.id as string,
    ttlMs: EDIT_TTL_MS,
  });

  return (
    <Shell>
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-center">
        <p className="text-sm font-medium text-green-700">
          ✓ {(restaurant.map_name as string) || (restaurant.name as string) || "Restaurant"} is now approved for the
          map.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Edit map info</h1>
        <p className="text-xs text-gray-500 mb-5">
          Fill in the location so this restaurant shows up correctly. This secure link works for 24 hours without
          signing in.
        </p>
        <MapEditForm
          restaurant={{
            id: restaurant.id as string,
            slug: restaurant.slug as string,
            name: (restaurant.name as string) ?? "",
            fields,
          }}
          token={editToken}
        />
      </div>
    </Shell>
  );
}
