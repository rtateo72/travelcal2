"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { Trip } from "@/lib/supabase/types";
import { format, parseISO, isPast } from "date-fns";

const TRIP_EMOJIS = ["✈️", "🏔️", "🏖️", "🌴", "🎿", "🚢", "🏕️", "🌍", "🗺️", "🎭"];

interface Props {
  user: { id: string; email?: string; user_metadata?: any };
  trips: Trip[];
}

export default function DashboardClient({ user, trips: initialTrips }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    emoji: "✈️",
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.start_date || !form.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error("End date must be after start date");
      return;
    }

    setCreating(true);
    const { data, error } = await (supabase.from("trips") as any)
  .insert({
    name: form.name,
    description: form.description || null,
    start_date: form.start_date,
    end_date: form.end_date,
    emoji: form.emoji,
    owner_id: user.id,
  })
  .select()
  .single();

    // if (error) {
    //   toast.error("Failed to create trip");
    //   setCreating(false);
    //   return;
    // }
    if (error) {
  toast.error(error.message);
  console.error(error);
  setCreating(false);
  return;
}

    toast.success("Trip created! 🎉");
    setShowModal(false);
    setForm({ name: "", description: "", start_date: "", end_date: "", emoji: "✈️" });
    router.push(`/trip/${data.id}`);
  };

  const upcomingTrips = trips.filter((t) => !isPast(parseISO(t.end_date)));
  const pastTrips = trips.filter((t) => isPast(parseISO(t.end_date)));

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.email;

  return (
    <div className="min-h-screen" style={{ background: "var(--sand)" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sand-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <span className="font-display text-lg font-bold text-coral-500">TravelCal</span>
          </div>
          <div className="flex items-center gap-3">
            {avatarUrl && (
              <Image
                src={avatarUrl}
                alt={name}
                width={32}
                height={32}
                className="rounded-full ring-2 ring-white"
              />
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-sand-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">
              Your trips
            </h1>
            <p className="text-gray-500 mt-1">
              {trips.length === 0 ? "No trips yet — create one!" : `${trips.length} trip${trips.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white font-semibold px-5 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="text-lg leading-none">+</span>
            New trip
          </button>
        </div>

        {/* Empty state */}
        {trips.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">
              Adventure awaits
            </h2>
            <p className="text-gray-400 mb-6">Create your first trip and invite your crew.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-coral-500 hover:bg-coral-600 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-sm"
            >
              + Create your first trip
            </button>
          </div>
        )}

        {/* Upcoming trips */}
        {upcomingTrips.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Upcoming
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}

        {/* Past trips */}
        {pastTrips.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Past trips
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {pastTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Create Trip Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">New trip</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-sand-100 transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trip vibe
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRIP_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji }))}
                      className={`text-2xl w-10 h-10 rounded-xl transition-all ${
                        form.emoji === emoji
                          ? "bg-coral-100 ring-2 ring-coral-400 scale-110"
                          : "hover:bg-sand-100"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Trip name <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spring Europe Trip"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Add a quick note..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent transition-all"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Start date <span className="text-coral-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    End date <span className="text-coral-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-coral-300 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 mt-2"
              >
                {creating ? "Creating..." : "Create trip ✈️"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const router = useRouter();
  const start = format(parseISO(trip.start_date), "MMM d");
  const end = format(parseISO(trip.end_date), "MMM d, yyyy");

  return (
    <button
      onClick={() => router.push(`/trip/${trip.id}`)}
      className="group text-left bg-white rounded-2xl border border-sand-200 p-5 hover:shadow-lg hover:border-coral-200 transition-all animate-slide-up active:scale-98"
    >
      <div className="text-3xl mb-3">{trip.emoji}</div>
      <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-coral-600 transition-colors">
        {trip.name}
      </h3>
      <p className="text-sm text-gray-400">
        {start} – {end}
      </p>
      {trip.description && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{trip.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-coral-500 bg-coral-50 px-2.5 py-1 rounded-full">
          View trip →
        </span>
      </div>
    </button>
  );
}
