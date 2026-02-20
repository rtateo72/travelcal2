import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const { data: ownedTrips } = await supabase
    .from("trips")
    .select("*, profiles(*)")
    .eq("owner_id", session.user.id)
    .order("start_date", { ascending: true });

  const { data: memberTrips } = await supabase
    .from("trip_members")
    .select("trips(*, profiles(*))")
    .eq("user_id", session.user.id);

  const joined = (memberTrips ?? [])
    .map((m: any) => m.trips)
    .filter(Boolean)
    .filter((t: any) => t.owner_id !== session.user.id);

  const allTrips = [...(ownedTrips ?? []), ...joined];

  return (
    <DashboardClient
      user={session.user}
      trips={allTrips}
    />
  );
}