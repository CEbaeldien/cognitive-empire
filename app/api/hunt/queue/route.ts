import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DRAFT_STATUSES = ["awaiting_principal", "approved"];
const COUNT_STATUSES = ["new", "qualified", "queued", "sent", "replied"] as const;

export async function GET() {
  const client = await createClient();
  const nowIso = new Date().toISOString();

  try {
    const [followupsRes, queuedBuyerRes, queuedPeerRes, queuedResearchRes, unqualifiedCountRes] = await Promise.all([
      client
        .from("hunt_prospects")
        .select("*")
        .eq("status", "sent")
        .lte("next_followup_at", nowIso)
        .order("next_followup_at", { ascending: true }),
      client
        .from("hunt_prospects")
        .select("*")
        .eq("status", "queued")
        .eq("tier", "buyer")
        .order("icp_score", { ascending: false }),
      client
        .from("hunt_prospects")
        .select("*")
        .eq("status", "queued")
        .eq("tier", "peer")
        .order("icp_score", { ascending: false }),
      client
        .from("hunt_prospects")
        .select("*")
        .eq("status", "queued")
        .eq("tier", "research")
        .order("created_at", { ascending: true }),
      client
        .from("hunt_prospects")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued")
        .eq("tier", "unqualified"),
    ]);

    if (followupsRes.error) throw new Error(followupsRes.error.message);
    if (queuedBuyerRes.error) throw new Error(queuedBuyerRes.error.message);
    if (queuedPeerRes.error) throw new Error(queuedPeerRes.error.message);
    if (queuedResearchRes.error) throw new Error(queuedResearchRes.error.message);
    if (unqualifiedCountRes.error) throw new Error(unqualifiedCountRes.error.message);

    const buyerProspects = [...(followupsRes.data ?? []), ...(queuedBuyerRes.data ?? [])].slice(0, 15);
    const peerProspects = queuedPeerRes.data ?? [];
    const researchProspects = queuedResearchRes.data ?? [];

    const draftableIds = [...buyerProspects, ...peerProspects].map((p) => p.id);

    let draftsByProspect: Record<string, unknown[]> = {};

    if (draftableIds.length > 0) {
      const { data: drafts, error: draftsError } = await client
        .from("hunt_drafts")
        .select("*")
        .in("prospect_id", draftableIds)
        .in("status", DRAFT_STATUSES)
        .order("created_at", { ascending: true });

      if (draftsError) throw new Error(draftsError.message);

      draftsByProspect = (drafts ?? []).reduce((acc: Record<string, unknown[]>, draft) => {
        const pid = (draft as { prospect_id: string }).prospect_id;
        (acc[pid] ??= []).push(draft);
        return acc;
      }, {});
    }

    const countPairs = await Promise.all(
      COUNT_STATUSES.map(async (status) => {
        const { count, error } = await client
          .from("hunt_prospects")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        if (error) throw new Error(error.message);
        return [status, count ?? 0] as const;
      })
    );

    return NextResponse.json({
      prospects: buyerProspects.map((p) => ({ ...p, drafts: draftsByProspect[p.id] ?? [] })),
      peerProspects: peerProspects.map((p) => ({ ...p, drafts: draftsByProspect[p.id] ?? [] })),
      researchProspects,
      filteredCount: unqualifiedCountRes.count ?? 0,
      counts: Object.fromEntries(countPairs),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
