import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// DEV-ONLY seed route — inserts 2 accounts and 4 opportunities with an overdue followup

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const workspaceId = process.env.DRIFT_WORKSPACE_ID;

  if (!supabaseUrl) return NextResponse.json({ error: "Missing NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
  if (!serviceRoleKey) return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  if (!workspaceId) return NextResponse.json({ error: "Missing DRIFT_WORKSPACE_ID" }, { status: 500 });

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Clear existing seed data in dependency order
  const seedNames = ["Veritas Capital Partners", "Meridian Health Systems"];
  const { data: existingAccounts } = await supabase
    .schema("drift")
    .from("accounts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("name", seedNames);

  if (existingAccounts && existingAccounts.length > 0) {
    const ids = existingAccounts.map((a) => a.id);
    await supabase.schema("drift").from("followups").delete().in("opportunity_id",
      (await supabase.schema("drift").from("opportunities").select("id").in("account_id", ids)).data?.map((o) => o.id) ?? []
    );
    await supabase.schema("drift").from("scores").delete().in("opportunity_id",
      (await supabase.schema("drift").from("opportunities").select("id").in("account_id", ids)).data?.map((o) => o.id) ?? []
    );
    await supabase.schema("drift").from("opportunities").delete().in("account_id", ids);
    await supabase.schema("drift").from("accounts").delete().in("id", ids);
  }

  // --- Accounts ---
  const { data: accounts, error: acctError } = await supabase
    .schema("drift")
    .from("accounts")
    .insert([
      {
        workspace_id: workspaceId,
        name: "Veritas Capital Partners",
        industry: "Financial Services",
        contact_name: "James Whitfield",
      },
      {
        workspace_id: workspaceId,
        name: "Meridian Health Systems",
        industry: "Healthcare",
        contact_name: "Dr. Sandra Ruiz",
      },
    ])
    .select("id, name");

  if (acctError) {
    return NextResponse.json({ error: "Failed to insert accounts", details: acctError }, { status: 500 });
  }

  const veritas = accounts!.find((a) => a.name === "Veritas Capital Partners")!;
  const meridian = accounts!.find((a) => a.name === "Meridian Health Systems")!;

  const today = new Date();
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString().split("T")[0];
  const daysFromNow = (n: number) => new Date(today.getTime() + n * 86400000).toISOString().split("T")[0];

  // --- Opportunities ---
  // Opp 1: CRITICAL — 20d no activity, no next action, Proposal stage, overdue followup, $180k
  //   Score: 35 + 25 + 25 + 10 + 10 = 105 → capped at 100
  // Opp 2: WATCH — 8d no activity, no next action, Discovery, $45k
  //   Score: 25 + 25 = 50
  // Opp 3: CRITICAL — 15d no activity, no next action, Negotiation, $320k
  //   Score: 35 + 25 + 10 + 10 = 80
  // Opp 4: HEALTHY — 3d no activity, has next action, Proposal, $85k
  //   Score: 12 + 10 + 10 = 32
  const { data: opps, error: oppError } = await supabase
    .schema("drift")
    .from("opportunities")
    .insert([
      {
        workspace_id: workspaceId,
        account_id: veritas.id,
        title: "Series B Advisory Engagement",
        value: 180000,
        currency: "USD",
        stage: "Proposal",
        probability: 65,
        status: "open",
        last_activity_date: daysAgo(20),
        expected_close_date: daysFromNow(30),
        next_action: null,
        next_action_due_date: null,
      },
      {
        workspace_id: workspaceId,
        account_id: veritas.id,
        title: "Q2 Strategy Review",
        value: 45000,
        currency: "USD",
        stage: "Discovery",
        probability: 40,
        status: "open",
        last_activity_date: daysAgo(8),
        expected_close_date: daysFromNow(45),
        next_action: null,
        next_action_due_date: null,
      },
      {
        workspace_id: workspaceId,
        account_id: meridian.id,
        title: "Enterprise License Agreement",
        value: 320000,
        currency: "USD",
        stage: "Negotiation",
        probability: 75,
        status: "open",
        last_activity_date: daysAgo(15),
        expected_close_date: daysFromNow(14),
        next_action: null,
        next_action_due_date: null,
      },
      {
        workspace_id: workspaceId,
        account_id: meridian.id,
        title: "Implementation Services",
        value: 85000,
        currency: "USD",
        stage: "Proposal",
        probability: 80,
        status: "open",
        last_activity_date: daysAgo(3),
        expected_close_date: daysFromNow(21),
        next_action: "Send revised SOW to Dr. Ruiz",
        next_action_due_date: daysFromNow(2),
      },
    ])
    .select("id, title");

  if (oppError) {
    return NextResponse.json({ error: "Failed to insert opportunities", details: oppError }, { status: 500 });
  }

  const seriesB = opps!.find((o) => o.title === "Series B Advisory Engagement")!;

  // --- Overdue followup on Series B (pushes it to 100) ---
  const { error: followupError } = await supabase
    .schema("drift")
    .from("followups")
    .insert({
      workspace_id: workspaceId,
      opportunity_id: seriesB.id,
      title: "Follow up on submitted proposal deck",
      due_date: daysAgo(5),
      status: "pending",
      priority: "high",
    });

  if (followupError) {
    return NextResponse.json({ error: "Failed to insert followup", details: followupError }, { status: 500 });
  }

  return NextResponse.json({
    message: "Seed complete",
    accounts: accounts!.map((a) => a.name),
    opportunities: opps!.map((o) => o.title),
  });
}
