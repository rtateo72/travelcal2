import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--sand)" }}>
      <div className="text-6xl mb-4">🗺️</div>
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Trip not found</h1>
      <p className="text-gray-500 mb-6">This trip doesn&rsquo;t exist or you don&rsquo;t have access.</p>
      <Link
        href="/dashboard"
        className="bg-coral-500 hover:bg-coral-600 text-white font-semibold px-6 py-3 rounded-2xl transition-all"
      >
        Back to dashboard
      </Link>
    </div>
  );
}