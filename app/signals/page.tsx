import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function formatVector(vector: string) {
  return vector
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSignalScore(signal: any) {
  const score = Array.isArray(signal.signal_scores)
    ? signal.signal_scores[0]
    : signal.signal_scores;

  return score?.final_score ?? 0;
}

function groupTopSignalsByDomain(signals: any[]) {
  const grouped = signals.reduce((acc: Record<string, any[]>, signal: any) => {
    const domain = signal.domain || "Unclassified";

    if (!acc[domain]) {
      acc[domain] = [];
    }

    acc[domain].push(signal);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([domain, domainSignals]) => {
      const topSignals = [...domainSignals]
        .sort((a: any, b: any) => getSignalScore(b) - getSignalScore(a))
        .slice(0, 3);

      return {
        domain,
        signals: topSignals,
      };
    })
    .sort((a, b) => {
      const bestA = getSignalScore(a.signals[0]);
      const bestB = getSignalScore(b.signals[0]);
      return bestB - bestA;
    });
}

export default async function SignalsPage() {
  const { data: signals, error } = await supabase
    .from("signals")
    .select(`
      id,
      title,
      domain,
      source_name,
      source_url,
      summary,
      what_changed,
      why_it_matters,
      implication,
      pressure_vectors,
      status,
      published_at,
      signal_scores (
        final_score,
        strength_score,
        weight_score,
        longevity_score,
        convergence_score,
        decay_score
      )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main className="min-h-screen bg-black p-10 text-red-400">
        <h1 className="text-2xl font-semibold">Signals Error</h1>
        <pre className="mt-4 whitespace-pre-wrap">
          {JSON.stringify(error, null, 2)}
        </pre>
      </main>
    );
  }

  const signalGroups = groupTopSignalsByDomain(signals || []);
  const totalVisibleSignals = signalGroups.reduce(
    (total, group) => total + group.signals.length,
    0
  );

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="mb-3 text-xs tracking-[0.4em] text-neutral-500">
            COGNITIVE EMPIRE
          </p>

          <h1 className="mb-4 text-5xl font-semibold tracking-tight">
            Signals
          </h1>

          <p className="max-w-3xl text-lg text-neutral-400">
            Structural intelligence across AI, robotics, energy, science,
            technology, agriculture, and space.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-neutral-400">
              {signalGroups.length} active domains
            </span>

            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-neutral-400">
              {totalVisibleSignals} visible signals
            </span>

            <span className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-neutral-400">
              Top 3 per domain
            </span>
          </div>
        </div>

        {signalGroups.length === 0 ? (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-10 text-neutral-400">
            No published signals yet.
          </div>
        ) : (
          <div className="space-y-16">
            {signalGroups.map((group) => (
              <section key={group.domain}>
                <div className="mb-6 flex flex-col gap-3 border-b border-neutral-900 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs tracking-[0.35em] text-neutral-600">
                      SIGNAL DOMAIN
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold text-white">
                      {group.domain}
                    </h2>
                  </div>

                  <p className="text-sm text-neutral-500">
                    Top {group.signals.length} published signals
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {group.signals.map((signal: any) => {
                    const score = Array.isArray(signal.signal_scores)
                      ? signal.signal_scores[0]
                      : signal.signal_scores;

                    return (
                      <article
                        key={signal.id}
                        className="rounded-3xl border border-neutral-800 bg-neutral-950 p-8"
                      >
                        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="mb-4 flex flex-wrap gap-3">
                              <span className="rounded-full border border-neutral-700 px-4 py-1 text-sm text-neutral-300">
                                {signal.domain || "Unclassified"}
                              </span>

                              <span className="rounded-full border border-white/20 bg-white px-4 py-1 text-sm font-semibold text-black">
                                CE Signal Score: {score?.final_score ?? "—"}
                              </span>
                            </div>

                            <h3 className="max-w-5xl text-4xl font-semibold leading-tight">
                              {signal.title}
                            </h3>

                            <p className="mt-4 text-neutral-500">
                              Source: {signal.source_name || "Unknown"}
                            </p>
                          </div>

                          {signal.source_url && (
                            <a
                              href={signal.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-neutral-700 px-6 py-3 text-sm transition hover:border-neutral-500"
                            >
                              Open Source
                            </a>
                          )}
                        </div>

                        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="rounded-2xl border border-neutral-800 p-6">
                            <p className="mb-4 text-xs tracking-[0.3em] text-neutral-500">
                              SIGNAL
                            </p>

                            <p className="text-lg leading-8 text-neutral-200">
                              {signal.what_changed ||
                                signal.summary ||
                                "No signal summary available."}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-neutral-800 p-6">
                            <p className="mb-4 text-xs tracking-[0.3em] text-neutral-500">
                              STRUCTURAL RELEVANCE
                            </p>

                            <p className="text-lg leading-8 text-neutral-200">
                              {signal.why_it_matters ||
                                "No structural relevance available."}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-neutral-800 p-6">
                            <p className="mb-4 text-xs tracking-[0.3em] text-neutral-500">
                              SECOND-ORDER EFFECT
                            </p>

                            <p className="text-lg leading-8 text-neutral-200">
                              {signal.implication ||
                                "No second-order effect available."}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="mb-4 text-xs tracking-[0.3em] text-neutral-500">
                            PRESSURE VECTORS
                          </p>

                          <div className="flex flex-wrap gap-3">
                            {(signal.pressure_vectors || []).length > 0 ? (
                              signal.pressure_vectors.map((vector: string) => (
                                <span
                                  key={vector}
                                  className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
                                >
                                  {formatVector(vector)}
                                </span>
                              ))
                            ) : (
                              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-500">
                                No pressure vectors assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}