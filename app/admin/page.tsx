export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabase";

export default async function AdminIndexPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!restaurant?.slug) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">No restaurant found</h1>
          <p className="text-gray-500">Your account is not linked to a restaurant. Please contact support.</p>
        </div>
      </main>
    );
  }

  redirect(`/admin/${restaurant.slug}`);
}
