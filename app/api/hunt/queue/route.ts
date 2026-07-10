import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DRAFT_STATUSES = ["awaiting_principal", "approved"];
const COUNT_STATUSES = ["new", "qualified", "queued", "sent", "replied"] as const;

export async function GET() {
  const client = await createClient();
  const nowIso = new Date().toISOString();

  try {
    const [followupsRes, queuedRes] = await Promise.all([
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
        .order("created_at", { ascending: true }),
    ]);

    if (followupsRes.error) throw new Error(followupsRes.error.message);
    if (queuedRes.error) throw new Error(queuedRes.error.message);

    const prospects = [...(followupsRes.data ?? []), ...(queuedRes.data ?? [])].slice(0, 15);
    const prospectIds = prospects.map((p) => p.id);

    let draftsByProspect: Record<string, unknown[]> = {};

    if (prospectIds.length > 0) {
      const { data: drafts, error: draftsError } = await client
        .from("hunt_drafts")
        .select("*")
        .in("prospect_id", prospectIds)
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
      prospects: prospects.map((p) => ({ ...p, drafts: draftsByProspect[p.id] ?? [] })),
      counts: Object.fromEntries(countPairs),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
