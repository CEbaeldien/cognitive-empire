import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function AdminSignalsPage() {
  const { data: reviewItems } = await supabase
    .from("review_queue")
    .select("*")
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-[0.4em] text-neutral-500 mb-3">
            COGNITIVE EMPIRE
          </p>

          <h1 className="text-5xl font-semibold tracking-tight mb-4">
            Signals Review Cockpit
          </h1>

          <p className="text-neutral-400 text-lg">
            Founder review layer for pending CE signal candidates.
          </p>
        </div>

        <div className="space-y-8">
          {reviewItems?.map((item) => (
            <div
              key={item.id}
              className="border border-neutral-800 rounded-3xl p-8 bg-neutral-950"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <span className="px-4 py-1 rounded-full border border-neutral-700 text-sm text-neutral-300">
                      {item.domain}
                    </span>

                    <span className="px-4 py-1 rounded-full border border-neutral-700 text-sm text-neutral-300">
                      Priority: {item.priority_level || "medium"}
                    </span>

                    <span className="px-4 py-1 rounded-full border border-neutral-700 text-sm text-neutral-300">
                      Status: {item.review_status}
                    </span>
                  </div>

                  <h2 className="text-4xl font-semibold leading-tight max-w-5xl">
                    {item.title}
                  </h2>

                  <p className="text-neutral-500 mt-4 text-lg">
                    Source: {item.source_name}
                  </p>
                </div>

                <a
                  href={item.source_url}
                  target="_blank"
                  className="border border-neutral-700 hover:border-neutral-500 transition px-6 py-3 rounded-2xl text-sm"
                >
                  Open Source
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="border border-neutral-800 rounded-2xl p-6">
                  <p className="text-xs tracking-[0.3em] text-neutral-500 mb-4">
                    SIGNAL
                  </p>

                  <p className="text-lg leading-9 text-neutral-200">
                    {item.event_summary}
                  </p>
                </div>

                <div className="border border-neutral-800 rounded-2xl p-6">
                  <p className="text-xs tracking-[0.3em] text-neutral-500 mb-4">
                    STRUCTURAL RELEVANCE
                  </p>

                  <p className="text-lg leading-9 text-neutral-200">
                    {item.structural_shift}
                  </p>
                </div>

                <div className="border border-neutral-800 rounded-2xl p-6">
                  <p className="text-xs tracking-[0.3em] text-neutral-500 mb-4">
                    SECOND-ORDER EFFECT
                  </p>

                  <p className="text-lg leading-9 text-neutral-200">
                    {item.operational_implication}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-xs tracking-[0.3em] text-neutral-500 mb-4">
                  PRESSURE VECTORS
                </p>

                <div className="flex flex-wrap gap-3">
                  {item.pressure_vectors?.map((vector: string) => (
                    <span
                      key={vector}
                      className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300"
                    >
                      {vector}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button className="px-8 py-4 rounded-2xl bg-white text-black font-medium hover:bg-neutral-200 transition">
                  Approve
                </button>

                <button className="px-8 py-4 rounded-2xl border border-yellow-700 text-yellow-400 hover:bg-yellow-950/30 transition">
                  Revise
                </button>

                <button className="px-8 py-4 rounded-2xl border border-red-800 text-red-400 hover:bg-red-950/30 transition">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}