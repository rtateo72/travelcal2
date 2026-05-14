"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { Trip, Profile, Availability, AvailabilityStatus } from "@/lib/supabase/types";

type StatusCycle = "none" | "free" | "tentative" | "busy";
const CYCLE: StatusCycle[] = ["none", "free", "tentative", "busy"];

const STATUS_CONFIG: Record<StatusCycle, { label: string; icon: string; bg: string; border: string; text: string }> = {
  none: { label: "No response", icon: "–", bg: "bg-white", border: "border-gray-200", text: "text-gray-400" },
  free: { label: "Free", icon: "🟢", bg: "bg-green-50", border: "border-green-400", text: "text-green-800" },
  tentative: { label: "Tentative", icon: "🟡", bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800" },
  busy: { label: "Busy", icon: "🔴", bg: "bg-red-50", border: "border-red-400", text: "text-red-800" },
};

interface MemberWithProfile {
  id: string;
  trip_id: string;
  user_id: string;
  joined_at: string;
  profiles: Profile;
}

interface AvailabilityWithProfile extends Availability {
  profiles: Profile;
}

interface Props {
  trip: Trip & { profiles: Profile };
  user: { id: string; user_metadata?: any; email?: string };
  members: MemberWithProfile[];
  ownerProfile: Profile | null;
  initialAvailability: AvailabilityWithProfile[];
  isOwner: boolean;
}

export default function TripClient({
  trip,
  user,
  members: initialMembers,
  ownerProfile,
  initialAvailability,
  isOwner,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [availability, setAvailability] = useState<AvailabilityWithProfile[]>(initialAvailability);
  const [members, setMembers] = useState<MemberWithProfile[]>(initialMembers);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const days = eachDayOfInterval({
    start: parseISO(trip.start_date),
    end: parseISO(trip.end_date),
  });

  const myStatus = useCallback(
    (dateStr: string): StatusCycle => {
      const entry = availability.find(
        (a) => a.user_id === user.id && a.date === dateStr
      );
      return (entry?.status as StatusCycle) ?? "none";
    },
    [availability, user.id]
  );

  const overlayStatus = useCallback(
    (dateStr: string) => {
      const entries = availability.filter((a) => a.date === dateStr);
      if (entries.length === 0) return "none";
      if (entries.some((e) => e.status === "busy")) return "busy";
      if (entries.some((e) => e.status === "tentative")) return "tentative";
      if (entries.every((e) => e.status === "free")) return "free";
      return "none";
    },
    [availability]
  );

  const dateBreakdown = useCallback(
    (dateStr: string) => {
      const allPeople = ownerProfile
        ? [{ profiles: ownerProfile, user_id: trip.owner_id }, ...members]
        : members;

      return allPeople.map((m) => {
        const entry = availability.find(
          (a) => a.user_id === m.user_id && a.date === dateStr
        );
        return {
          profile: m.profiles,
          status: (entry?.status as StatusCycle) ?? "none",
        };
      });
    },
    [availability, members, ownerProfile, trip.owner_id]
  );

  const handleDayClick = async (dateStr: string) => {
    const current = myStatus(dateStr);
    const nextIdx = (CYCLE.indexOf(current) + 1) % CYCLE.length;
    const next = CYCLE[nextIdx];

    setUpdating(dateStr);

    setAvailability((prev) => {
      const filtered = prev.filter((a) => !(a.user_id === user.id && a.date === dateStr));
      if (next === "none") return filtered;
      return [
        ...filtered,
        {
          id: `temp-${dateStr}`,
          trip_id: trip.id,
          user_id: user.id,
          date: dateStr,
          status: next as AvailabilityStatus,
          updated_at: new Date().toISOString(),
          profiles: user.user_metadata as Profile,
        },
      ];
    });

    if (next === "none") {
      await (supabase
        .from("availability")
        .delete() as any)
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .eq("date", dateStr);
    } else {
      await (supabase.from("availability").upsert as any)(
        {
          trip_id: trip.id,
          user_id: user.id,
          date: dateStr,
          status: next as AvailabilityStatus,
        },
        { onConflict: "trip_id,user_id,date" }
      );
    }

    setUpdating(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", inviteEmail.trim().toLowerCase())
      .single();

    const profile = profileData as Profile | null;

    if (error || !profile) {
      toast.error("No account found with that email");
      setInviting(false);
      return;
    }

    const alreadyMember =
      (profile as any).id === trip.owner_id ||
      members.some((m) => m.user_id === (profile as any).id);

    if (alreadyMember) {
      toast.error("That person is already on this trip");
      setInviting(false);
      return;
    }

    const { error: insertError } = await (supabase
      .from("trip_members")
      .insert as any)({ trip_id: trip.id, user_id: profile.id });

    if (insertError) {
      toast.error("Failed to add member");
      setInviting(false);
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        id: `temp-${profile.id}`,
        trip_id: trip.id,
        user_id: profile.id,
        joined_at: new Date().toISOString(),
        profiles: profile,
      },
    ]);

    toast.success(`${profile.full_name ?? profile.email} added to the trip! 🎉`);
    setInviteEmail("");
    setInviting(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`trip-${trip.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability",
          filter: `trip_id=eq.${trip.id}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setAvailability((prev) =>
              prev.filter((a) => a.id !== payload.old.id)
            );
          } else {
            const { data } = await supabase
              .from("availability")
              .select("*, profiles(*)")
              .eq("id", payload.new.id)
              .single();

            if (data) {
              const typedData = data as AvailabilityWithProfile;
              setAvailability((prev) => {
              const filtered = prev.filter(
              (a) => !(a.user_id === typedData.user_id && a.date === typedData.date)
    );
    return [...filtered, typedData];
  });
}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip.id]);

  const allParticipants = ownerProfile
    ? [{ profiles: ownerProfile, user_id: trip.owner_id, isOwner: true }, ...members.map((m) => ({ ...m, isOwner: false }))]
    : members.map((m) => ({ ...m, isOwner: false }));

  const months: { [key: string]: Date[] } = {};
  days.forEach((day) => {
    const key = format(day, "yyyy-MM");
    if (!months[key]) months[key] = [];
    months[key].push(day);
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--sand)" }}>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sand-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 hover:text-gray-800 transition-colors text-sm flex items-center gap-1.5"
          >
            ← Back
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xl">{trip.emoji}</span>
          <span className="font-display font-bold text-gray-900 text-lg">{trip.name}</span>
          <span className="text-sm text-gray-400 hidden sm:block">
            {format(parseISO(trip.start_date), "MMM d")} –{" "}
            {format(parseISO(trip.end_date), "MMM d, yyyy")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowSidePanel((v) => !v)}
              className="text-sm border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl transition-all bg-white text-gray-600"
            >
              👥 {allParticipants.length}
            </button>
          </div>
        </div>
      </nav>

<div className="flex flex-col-reverse lg:flex-row flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">
          <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
            <span className="font-semibold text-gray-700">Your availability:</span>
            {(["free", "tentative", "busy", "none"] as StatusCycle[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-gray-500">
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </span>
            ))}
            <span className="text-gray-400 ml-2">← click dates to cycle</span>
          </div>

          {Object.entries(months).map(([monthKey, monthDays]) => (
            <div key={monthKey} className="mb-8">
              <h2 className="font-display font-bold text-xl text-gray-700 mb-3">
                {format(monthDays[0], "MMMM yyyy")}
              </h2>

              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {monthDays[0] && (() => {
                  const offset = monthDays[0].getDay();
                  return Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ));
                })()}

                {monthDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const myS = myStatus(dateStr);
                  const overlay = overlayStatus(dateStr);
                  const cfg = STATUS_CONFIG[myS];
                  const isUpdating = updating === dateStr;
                  const isHovered = hoveredDate === dateStr;
                  const breakdown = dateBreakdown(dateStr);
                  const allFree =
  allParticipants.length > 1 &&
  allParticipants.every((p) =>
    availability.some(
      (a) => a.user_id === p.user_id && a.date === dateStr && a.status === "free"
    )
  );

                  return (
                    <div key={dateStr} className="relative">
                      <button
                        onClick={() => handleDayClick(dateStr)}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        disabled={isUpdating}
                        className={`day-cell w-full aspect-square flex flex-col items-center justify-center rounded-xl border-2 ${
  allFree
    ? "bg-green-100 border-green-500 ring-2 ring-green-400 ring-offset-1"
    : "bg-white border-gray-200"
} ${cfg.text} ${isUpdating ? "opacity-50" : ""} select-none`}
                      >
                        <span className="text-xs font-bold mb-0.5">{format(day, "d")}</span>
<div className="flex flex-wrap justify-center gap-0.5">
  {dateBreakdown(dateStr)
    .filter(({ status }) => status !== "none")
    .map(({ profile, status }) => (
      <div
        key={profile.id}
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
          status === "free" ? "bg-green-400 text-white" :
          status === "tentative" ? "bg-amber-400 text-white" :
          "bg-red-400 text-white"
        }`}
      >
        {(profile.full_name ?? profile.email ?? "?")[0].toUpperCase()}
      </div>
    ))}
</div>

                        {overlay !== "none" && overlay !== myS && (
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            overlay === "free" ? "bg-green-400" :
                            overlay === "tentative" ? "bg-amber-400" : "bg-red-400"
                          }`} />
                        )}
                      </button>

                      {isHovered && breakdown.length > 0 && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-max">
                          <div className="font-semibold text-xs text-gray-500 mb-2">
                            {format(day, "EEE, MMM d")}
                          </div>
                          {breakdown.map(({ profile, status }) => (
                            <div key={profile.id} className="flex items-center gap-2 text-xs py-0.5">
                              {profile.avatar_url ? (
                                <Image
                                  src={profile.avatar_url}
                                  alt={profile.full_name ?? ""}
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-sand-200 flex items-center justify-center text-xs">
                                  {(profile.full_name ?? profile.email ?? "?")[0]}
                                </div>
                              )}
                              <span className="text-gray-700 truncate max-w-24">
                                {profile.full_name ?? profile.email}
                              </span>
                              <span>{STATUS_CONFIG[status].icon}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {showSidePanel && (
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-sand-200 p-5 sticky top-20">
              <h3 className="font-display font-bold text-base text-gray-900 mb-4">
                Crew ({allParticipants.length})
              </h3>
              <div className="space-y-3 mb-6">
                {allParticipants.map(({ profiles: profile, user_id, isOwner: isOwnerMember }) => {
                  const userAvail = availability.filter((a) => a.user_id === user_id);
                  const freeCount = userAvail.filter((a) => a.status === "free").length;
                  const busyCount = userAvail.filter((a) => a.status === "busy").length;
                  const tentCount = userAvail.filter((a) => a.status === "tentative").length;

                  return (
                    <div key={user_id} className="flex items-start gap-2.5">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.full_name ?? ""}
                          width={32}
                          height={32}
                          className="rounded-full flex-shrink-0 ring-2 ring-white"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {(profile?.full_name ?? profile?.email ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1">
                          {profile?.full_name ?? profile?.email ?? "Member"}
                          {isOwnerMember && (
                            <span className="text-xs text-coral-500 font-normal">owner</span>
                          )}
                          {user_id === user.id && (
                            <span className="text-xs text-gray-400 font-normal">you</span>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-0.5 text-xs text-gray-400">
                          {freeCount > 0 && <span className="text-green-600">🟢 {freeCount}</span>}
                          {tentCount > 0 && <span className="text-amber-600">🟡 {tentCount}</span>}
                          {busyCount > 0 && <span className="text-red-600">🔴 {busyCount}</span>}
                          {freeCount + tentCount + busyCount === 0 && (
                            <span>No responses yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-sand-200 pt-5">
                <p className="text-xs font-semibold text-gray-500 mb-2">Add someone by email</p>
                <form onSubmit={handleInvite} className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="friend@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="w-full text-sm font-semibold bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white py-2.5 rounded-xl transition-all"
                  >
                    {inviting ? "Adding..." : "Add to trip"}
                  </button>
                </form>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}