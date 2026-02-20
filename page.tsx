"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--sand)" }}>
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-sand-200 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <span className="font-display text-xl font-bold text-coral-500">TravelCal</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: hero text */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-16 lg:py-0">
          <div className="max-w-xl animate-slide-up">
            <div className="inline-block bg-coral-100 text-coral-600 text-sm font-semibold px-3 py-1 rounded-full mb-6">
              Plan trips, not spreadsheets
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight text-gray-900 mb-6">
              Coordinate your crew&rsquo;s{" "}
              <span className="text-coral-500 italic">availability</span>{" "}
              in seconds.
            </h1>
            <p className="text-lg text-gray-500 mb-10 leading-relaxed">
              Create a trip, share a link, and watch your group&rsquo;s calendars come together.
              No more &ldquo;when works for everyone?&rdquo; threads.
            </p>

            <button
              onClick={handleGoogleLogin}
              className="flex items-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all px-6 py-4 rounded-2xl font-semibold text-gray-800 text-base shadow-sm active:scale-95"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-sm text-gray-400 mt-4">
              Free to use. No credit card required.
            </p>
          </div>
        </div>

        {/* Right: preview illustration */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <CalendarPreview />
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border-t border-sand-200 px-8 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: "🗓️", title: "Visual availability", desc: "Click dates to mark Free, Tentative, or Busy. Instant sync for everyone." },
            { icon: "🔗", title: "Shareable invite link", desc: "One link. Anyone can join your trip and add their availability." },
            { icon: "🟢", title: "Group overlay", desc: "See at a glance when everyone's free — no back-and-forth." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function CalendarPreview() {
  const days = [
    { label: "Mon 3", status: "free" },
    { label: "Tue 4", status: "free" },
    { label: "Wed 5", status: "tentative" },
    { label: "Thu 6", status: "free" },
    { label: "Fri 7", status: "busy" },
    { label: "Sat 8", status: "free" },
    { label: "Sun 9", status: "free" },
    { label: "Mon 10", status: "tentative" },
    { label: "Tue 11", status: "free" },
    { label: "Wed 12", status: "free" },
  ];

  const colors: Record<string, string> = {
    free: "bg-green-100 border-green-400 text-green-800",
    tentative: "bg-amber-100 border-amber-400 text-amber-800",
    busy: "bg-red-100 border-red-400 text-red-800",
  };
  const icons: Record<string, string> = {
    free: "🟢",
    tentative: "🟡",
    busy: "🔴",
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-sand-200 overflow-hidden animate-fade-in">
      <div className="bg-coral-500 px-6 py-5 text-white">
        <div className="text-sm font-medium opacity-80 mb-1">✈️ Europe Trip</div>
        <div className="font-display text-2xl font-bold">May 3 – May 12</div>
        <div className="text-sm opacity-70 mt-1">4 people planning</div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-2">
        {days.map((d) => (
          <div
            key={d.label}
            className={`border-2 rounded-xl px-3 py-2.5 flex items-center justify-between text-sm font-semibold ${colors[d.status]}`}
          >
            <span>{d.label}</span>
            <span>{icons[d.status]}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 flex gap-3 text-xs font-medium text-gray-500">
        <span className="flex items-center gap-1">🟢 Free</span>
        <span className="flex items-center gap-1">🟡 Tentative</span>
        <span className="flex items-center gap-1">🔴 Busy</span>
      </div>
    </div>
  );
}
