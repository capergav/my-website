import { createSupabaseServerClient } from "@/app/lib/supabase";

// The single founder account allowed to see the (still-hidden) discovery map
// and the map admin tools. Gating is ALWAYS done server-side off the
// authenticated Supabase session — never a client cookie or client-side email
// check — so a non-owner visitor never receives the gated markup at all.
export const MAP_OWNER_EMAIL = "gavinrgallant@gmail.com";

/**
 * Returns the authenticated user ONLY if their verified session email is the
 * founder account, otherwise null. Server-only.
 */
export async function getMapOwner(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (user.email.toLowerCase() !== MAP_OWNER_EMAIL.toLowerCase()) return null;
  return { id: user.id, email: user.email };
}
