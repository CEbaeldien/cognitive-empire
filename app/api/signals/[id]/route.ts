import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = sb();

  const [signalRes, scoreRes, pvRes, dvRes] = await Promise.all([
    client.from("signals").select("*").eq("id", id).single(),
    client.from("signal_scores").select("*").eq("signal_id", id).maybeSingle(),
    client.from("signal_pressure_vectors").select("vector_id").eq("signal_id", id),
    client.from("signal_doctrine_vectors").select("doctrine_vector_id").eq("signal_id", id),
  ]);

  if (signalRes.error) {
    const status = signalRes.error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: signalRes.error.message }, { status });
  }

  return NextResponse.json({
    signal:               signalRes.data,
    score:                scoreRes.data ?? null,
    pressure_vector_ids:  (pvRes.data  ?? []).map((r: { vector_id: string })         => r.vector_id),
    doctrine_vector_ids:  (dvRes.data  ?? []).map((r: { doctrine_vector_id: string }) => r.doctrine_vector_id),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Strip server-managed and junction fields before updating the signals row
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { created_at, id: _id, pressure_vector_ids, doctrine_vector_ids, ...patch } = body;

  const client = sb();

  const { data, error } = await client
    .from("signals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync pressure vector junctions when explicitly provided
  if (Array.isArray(pressure_vector_ids)) {
    await client.from("signal_pressure_vectors").delete().eq("signal_id", id);
    if (pressure_vector_ids.length > 0) {
      await client.from("signal_pressure_vectors").insert(
        pressure_vector_ids.map((vid: string) => ({ signal_id: id, vector_id: vid }))
      );
    }
  }

  // Sync doctrine vector junctions when explicitly provided
  if (Array.isArray(doctrine_vector_ids)) {
    await client.from("signal_doctrine_vectors").delete().eq("signal_id", id);
    if (doctrine_vector_ids.length > 0) {
      await client.from("signal_doctrine_vectors").insert(
        doctrine_vector_ids.map((did: string) => ({ signal_id: id, doctrine_vector_id: did }))
      );
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await sb()
    .from("signals")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
