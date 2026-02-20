import { createServerClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import TripClient from "./TripClient";
import type { Trip, Profile } from "@/lib/supabase/types";

interface Props {
  params: { id: string };
  searchParams: { invite?: string };
}

export default async function TripPage({ params, searchParams }: Props) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/?next=/trip/${params.id}`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("*, profiles(*)")
    .eq("id", params.id)
    .single();

  if (!trip) notFound();

  const typedTrip = trip as Trip & { profiles: Profile };

  const isOwner = typedTrip.owner_id === session.user.id;

  const { data: membership } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", params.id)
    .eq("user_id", session.user.id)
    .single();

  const isMember = !!membership;

  if (!isOwner && !isMember) {
    await (supabase
      .from("trip_members")
      .insert as any)({ trip_id: params.id, user_id: session.user.id });
  }

  const { data: members } = await supabase
    .from("trip_members")
    .select("*, profiles(*)")
    .eq("trip_id", params.id);

  const { data: availability } = await supabase
    .from("availability")
    .select("*, profiles(*)")
    .eq("trip_id", params.id);

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", typedTrip.owner_id)
    .single();

  return (
    <TripClient
      trip={typedTrip}
      user={session.user}
      members={members ?? []}
      ownerProfile={ownerProfile}
      initialAvailability={availability ?? []}
      isOwner={isOwner}
    />
  );
}