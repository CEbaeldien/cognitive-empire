// Mesodma V2 — deterministic clustering engine.
// Matches factual_atoms to evidence_clusters. Computes evidence_mass.
// No AI calls. All logic is deterministic and locked per spec.
// Evidence mass formula is frozen — do not adjust multipliers without founder approval.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  FactualAtomRow,
  EvidenceClusterRow,
  ClusterPassReport,
} from "./v2-types";

// ── Config ─────────────────────────────────────────────────────────────────────

const MATCH_ATOM_LIMIT  = 50; // atoms processed per clustering pass (Vercel constraint)
const DECAY_DAYS        = 14; // days without new atom → cluster decays toward expired
const CLUSTER_WINDOW_DAYS = 30;

// Evidence mass formula weights — LOCKED per spec
const SOURCE_WEIGHT: Record<string, number> = {
  tier_1_primary:    1.5,
  tier_2_technical:  1.3,
  tier_3_media:      1.0,
  tier_4_noise_prone: 0.6,
};

const EVIDENCE_TYPE_WEIGHT: Record<string, number> = {
  deployment: 1.3,
  data:       1.3,
  incident:   1.3,
  policy:     1.2,
  financial:  1.1,
  research:   1.0,
  announcement: 0.8,
};

const DISTRIBUTION_PENALTY: Record<string, number> = {
  origin:    1.0,
  early:     0.9,
  wave:      0.6,
  saturated: 0.4,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function sb(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function daysSince(iso: string | null): number {
  if (!iso) return 9999;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

function recencyFactor(iso: string | null): number {
  const d = daysSince(iso);
  if (d <= 7)  return 1.0;
  if (d <= 14) return 0.8;
  if (d <= 30) return 0.6;
  return 0.3;
}

function hasOverlap(a: string[], b: string[]): boolean {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  return b.some((s) => setA.has(s.toLowerCase()));
}

// ── Matching logic ─────────────────────────────────────────────────────────────
// Returns overlap score 0–5 (REQUIRED: shared invariant_id; score ≥ 2 to attach)

function scoreAtomClusterMatch(
  atom: FactualAtomRow,
  cluster: EvidenceClusterRow
): number {
  // Required: atom must tag cluster's invariant
  if (!atom.possible_invariant_ids.includes(cluster.invariant_id)) return -1;

  let score = 0;
  if (cluster.vector_id && atom.possible_vector_ids.includes(cluster.vector_id)) score++;
  if (hasOverlap([...atom.entities, ...atom.companies], cluster.entity_keys))     score++;
  if (hasOverlap(atom.countries, cluster.geography_keys))                          score++;
  if (hasOverlap(atom.technologies, cluster.technology_keys))                      score++;

  // Time window: cluster active within last CLUSTER_WINDOW_DAYS days
  if (daysSince(cluster.last_atom_at) <= CLUSTER_WINDOW_DAYS) score++;

  return score;
}

// ── Evidence mass formula ──────────────────────────────────────────────────────
// Deterministic. Locked per spec. AI never calls this function.

type AtomWithSource = FactualAtomRow & { source_tier?: string | null };

export function computeEvidenceMass(atoms: AtomWithSource[], cluster: EvidenceClusterRow): number {
  const atomSum = atoms.reduce((sum, atom) => {
    const sw  = SOURCE_WEIGHT[atom.source_tier ?? ""] ?? (atom.source_weight ?? 1.0);
    const rf  = recencyFactor(atom.created_at);
    const etw = EVIDENCE_TYPE_WEIGHT[atom.evidence_type ?? ""] ?? 1.0;
    const fsp = 1 - (atom.false_signal_risk ?? 0) * 0.5;
    const dp  = DISTRIBUTION_PENALTY[atom.distribution_stage ?? ""] ?? 1.0;
    return sum + (sw * rf * etw * fsp * dp * 10);
  }, 0);

  // Bonuses
  const distinctSources = new Set(atoms.map((a) => a.source_id).filter(Boolean)).size;
  const independenceBonus = Math.min(distinctSources, 6) * 2;

  const allVectorIds = atoms.flatMap((a) => a.possible_vector_ids ?? []);
  const vectorSpreadBonus = new Set(allVectorIds).size > 1 ? 5 : 0;

  // Corroboration: ≥3 independent sources with atoms within 14 days
  const recent14d = atoms.filter((a) => daysSince(a.created_at) <= 14);
  const recentSources = new Set(recent14d.map((a) => a.source_id).filter(Boolean)).size;
  const corroboration = recentSources >= 3 ? 8 : 0;

  // Penalties
  const contradictionPenalty = (cluster.contradiction_level ?? 0) * 10;

  const raw = atomSum + independenceBonus + vectorSpreadBonus + corroboration - contradictionPenalty;
  return Math.min(100, Math.max(0, raw));
}

// ── Cluster status from mass ───────────────────────────────────────────────────

function massToStatus(mass: number, current: string): string {
  if (current === "converted" || current === "expired" || current === "rejected" || current === "contradicted") {
    return current;
  }
  if (mass >= 75) return "signal_candidate";
  if (mass >= 60) return "mature";
  if (mass >= 20) return "accumulating";
  return "seed";
}

// ── Seed a new cluster from an atom ───────────────────────────────────────────

async function seedCluster(
  client: SupabaseClient,
  atom: FactualAtomRow
): Promise<number | null> {
  const invariantId = atom.possible_invariant_ids[0];
  if (!invariantId) return null;

  const vectorId = atom.possible_vector_ids[0] ?? null;
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("evidence_clusters")
    .insert({
      invariant_id:      invariantId,
      vector_id:         vectorId,
      working_title:     atom.atom_summary?.slice(0, 200) ?? "(new cluster)",
      status:            "seed",
      evidence_mass:     0,
      atom_count:        0,
      source_count:      0,
      entity_keys:       [...(atom.entities ?? []), ...(atom.companies ?? [])],
      geography_keys:    atom.countries ?? [],
      technology_keys:   atom.technologies ?? [],
      first_atom_at:     now,
      last_atom_at:      now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[clustering] seed cluster failed:", error.message);
    return null;
  }
  return data.id as number;
}

// ── Attach atom to cluster ─────────────────────────────────────────────────────

async function attachAtom(
  client: SupabaseClient,
  atomId: number,
  clusterId: number
): Promise<void> {
  const { error } = await client
    .from("cluster_atoms")
    .insert({ cluster_id: clusterId, atom_id: atomId })
    .select();
  // Ignore duplicate key errors (atom already in cluster)
  if (error && !error.message.includes("duplicate")) {
    throw new Error(`Attach atom ${atomId} to cluster ${clusterId}: ${error.message}`);
  }
}

// ── Recompute evidence mass for a cluster ─────────────────────────────────────

async function recomputeMass(client: SupabaseClient, clusterId: number): Promise<void> {
  // Load all atoms in this cluster with their source tier
  const { data: caData, error: caErr } = await client
    .from("cluster_atoms")
    .select("atom_id")
    .eq("cluster_id", clusterId);

  if (caErr || !caData?.length) return;

  const atomIds = caData.map((r: { atom_id: number }) => r.atom_id);

  const { data: atomsData, error: atomsErr } = await client
    .from("factual_atoms")
    .select("*, sources(source_tier)")
    .in("id", atomIds);

  if (atomsErr) return;

  const atoms = (atomsData ?? []) as Array<FactualAtomRow & { sources: { source_tier: string | null } | null }>;
  const enriched = atoms.map((a) => ({ ...a, source_tier: a.sources?.source_tier ?? null }));

  const { data: clusterData, error: clusterErr } = await client
    .from("evidence_clusters")
    .select("*")
    .eq("id", clusterId)
    .single();

  if (clusterErr || !clusterData) return;
  const cluster = clusterData as EvidenceClusterRow;

  const mass = computeEvidenceMass(enriched, cluster);
  const distinctSources = new Set(enriched.map((a) => a.source_id).filter(Boolean)).size;
  const newStatus = massToStatus(mass, cluster.status);

  // Merge entity/geography/technology keys from all atoms
  const allEntities = [...new Set(enriched.flatMap((a) => [...(a.entities ?? []), ...(a.companies ?? [])]))];
  const allGeos     = [...new Set(enriched.flatMap((a) => a.countries ?? []))];
  const allTechs    = [...new Set(enriched.flatMap((a) => a.technologies ?? []))];
  const latestAtom  = enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  await client
    .from("evidence_clusters")
    .update({
      evidence_mass:     mass,
      atom_count:        enriched.length,
      source_count:      distinctSources,
      status:            newStatus,
      entity_keys:       allEntities.slice(0, 50),
      geography_keys:    allGeos.slice(0, 20),
      technology_keys:   allTechs.slice(0, 30),
      last_atom_at:      latestAtom?.created_at ?? cluster.last_atom_at,
    })
    .eq("id", clusterId);
}

// ── Decay check ───────────────────────────────────────────────────────────────

async function runDecayCheck(client: SupabaseClient): Promise<number> {
  const cutoff = new Date(Date.now() - DECAY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("evidence_clusters")
    .select("id")
    .in("status", ["seed", "accumulating", "mature"])
    .lt("last_atom_at", cutoff);

  if (error || !data?.length) return 0;

  const ids = data.map((r: { id: number }) => r.id);
  await client
    .from("evidence_clusters")
    .update({ status: "expired" })
    .in("id", ids);

  return ids.length;
}

// ── Main clustering pass ───────────────────────────────────────────────────────

export async function runClusteringPass(): Promise<ClusterPassReport> {
  const started_at = new Date().toISOString();
  const client = sb();
  const errors: string[] = [];

  let atomsProcessed  = 0;
  let clustersCreated = 0;
  let clustersUpdated = 0;
  let clustersMatured = 0;
  let clustersExpired = 0;

  // Load atoms not yet in any cluster.
  // Fetch clustered IDs first — PostgREST can't execute SQL subqueries as filter values.
  const { data: clusteredRows } = await client
    .from("cluster_atoms")
    .select("atom_id");
  const clusteredIds = (clusteredRows ?? []).map((r: { atom_id: number }) => r.atom_id);

  let atomQuery = client
    .from("factual_atoms")
    .select("*, sources(source_tier)")
    .eq("status", "atom")
    .order("created_at", { ascending: true })
    .limit(MATCH_ATOM_LIMIT);

  if (clusteredIds.length > 0) {
    atomQuery = atomQuery.not("id", "in", `(${clusteredIds.join(",")})`);
  }

  const { data: atomData, error: atomErr } = await atomQuery;

  if (atomErr) {
    return {
      started_at,
      completed_at: new Date().toISOString(),
      atoms_processed: 0,
      clusters_created: 0,
      clusters_updated: 0,
      clusters_matured: 0,
      clusters_expired: 0,
      errors: [atomErr.message],
    };
  }

  const atoms = (atomData ?? []) as Array<FactualAtomRow & { sources: { source_tier: string | null } | null }>;

  // Load all open clusters once
  const { data: clusterData, error: clusterErr } = await client
    .from("evidence_clusters")
    .select("*")
    .in("status", ["seed", "accumulating", "mature"]);

  if (clusterErr) {
    return {
      started_at,
      completed_at: new Date().toISOString(),
      atoms_processed: 0,
      clusters_created: 0,
      clusters_updated: 0,
      clusters_matured: 0,
      clusters_expired: 0,
      errors: [clusterErr.message],
    };
  }

  let openClusters = (clusterData ?? []) as EvidenceClusterRow[];
  const touchedClusterIds = new Set<number>();

  for (const atom of atoms) {
    atomsProcessed++;

    // Find all qualifying clusters (shared invariant + score >= 2)
    const qualifying = openClusters
      .filter((c) => {
        const score = scoreAtomClusterMatch(atom, c);
        return score >= 2;
      })
      .sort((a, b) => {
        // Prefer clusters with highest score, then most recent activity
        const sa = scoreAtomClusterMatch(atom, a);
        const sb = scoreAtomClusterMatch(atom, b);
        return sb - sa || new Date(b.last_atom_at ?? 0).getTime() - new Date(a.last_atom_at ?? 0).getTime();
      });

    if (qualifying.length === 0) {
      // Seed a new cluster
      const newId = await seedCluster(client, atom);
      if (newId) {
        try {
          await attachAtom(client, atom.id, newId);
          clustersCreated++;
          touchedClusterIds.add(newId);
          // Refresh open clusters list to include the new one
          const { data: newCluster } = await client
            .from("evidence_clusters")
            .select("*")
            .eq("id", newId)
            .single();
          if (newCluster) openClusters.push(newCluster as EvidenceClusterRow);
        } catch (err) {
          errors.push(`Atom ${atom.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      // Attach to all qualifying clusters (an atom with 2-3 invariant tags may attach to multiple)
      for (const cluster of qualifying) {
        try {
          await attachAtom(client, atom.id, cluster.id);
          touchedClusterIds.add(cluster.id);
          clustersUpdated++;
        } catch (err) {
          errors.push(`Atom ${atom.id} → cluster ${cluster.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // Recompute mass for all touched clusters
  for (const clusterId of touchedClusterIds) {
    try {
      const beforeRes = await client.from("evidence_clusters").select("status").eq("id", clusterId).single();
      const beforeStatus = beforeRes.data?.status as string;
      await recomputeMass(client, clusterId);
      const afterRes = await client.from("evidence_clusters").select("status, evidence_mass").eq("id", clusterId).single();
      if (afterRes.data?.status === "mature" && beforeStatus !== "mature") clustersMatured++;
    } catch (err) {
      errors.push(`Recompute mass cluster ${clusterId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Run decay check on untouched clusters
  try {
    clustersExpired = await runDecayCheck(client);
  } catch (err) {
    errors.push(`Decay check: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    started_at,
    completed_at: new Date().toISOString(),
    atoms_processed:  atomsProcessed,
    clusters_created: clustersCreated,
    clusters_updated: clustersUpdated,
    clusters_matured: clustersMatured,
    clusters_expired: clustersExpired,
    errors,
  };
}
