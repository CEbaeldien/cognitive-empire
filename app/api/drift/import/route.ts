import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const workspaceId = process.env.DRIFT_WORKSPACE_ID!;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!workspaceId) throw new Error("Missing DRIFT_WORKSPACE_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const REQUIRED_COLUMNS = ["account_name", "opportunity_title", "value", "stage"];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// POST /api/drift/import — parse CSV, upsert accounts, create opportunities
export async function POST(req: Request) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart/form-data with a 'file' field." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a .csv" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row." },
        { status: 400 }
      );
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const dataLines = lines.slice(1);

    const missingRequired = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingRequired.join(", ")}` },
        { status: 422 }
      );
    }

    // Create batch as "processing"
    const { data: batch, error: batchErr } = await supabase
      .schema("drift")
      .from("import_batches")
      .insert({
        workspace_id: workspaceId,
        import_source: "csv",
        file_name: file.name,
        status: "processing",
        total_rows: dataLines.length,
        successful_rows: 0,
        failed_rows: 0,
        mapping: { detected_columns: headers },
        error_log: null,
      })
      .select("id")
      .single();

    if (batchErr || !batch) {
      return NextResponse.json(
        { error: "Failed to create import batch", details: batchErr },
        { status: 500 }
      );
    }

    const batchId: string = batch.id;
    const rowErrors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2;
      const values = parseCSVLine(dataLines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] ?? "").trim(); });

      const accountName = row.account_name;
      const oppTitle = row.opportunity_title;

      if (!accountName) {
        rowErrors.push(`Row ${rowNum}: missing account_name`);
        continue;
      }
      if (!oppTitle) {
        rowErrors.push(`Row ${rowNum}: missing opportunity_title`);
        continue;
      }

      try {
        // Find or create account
        let accountId: string;
        const { data: existing } = await supabase
          .schema("drift")
          .from("accounts")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("name", accountName)
          .maybeSingle();

        if (existing) {
          accountId = existing.id;
        } else {
          const accountInsert: Record<string, unknown> = {
            workspace_id: workspaceId,
            name: accountName,
          };
          if (row.contact_name) accountInsert.contact_name = row.contact_name;

          const { data: newAccount, error: accErr } = await supabase
            .schema("drift")
            .from("accounts")
            .insert(accountInsert)
            .select("id")
            .single();

          if (accErr || !newAccount) {
            rowErrors.push(`Row ${rowNum}: failed to create account "${accountName}" — ${accErr?.message}`);
            continue;
          }
          accountId = newAccount.id;
        }

        // Build opportunity record — only set fields confirmed in schema
        const opp: Record<string, unknown> = {
          workspace_id: workspaceId,
          account_id: accountId,
          title: oppTitle,
          status: "open",
          currency: row.currency || "USD",
        };
        if (row.value) opp.value = parseFloat(row.value);
        if (row.stage) opp.stage = row.stage;
        if (row.probability) opp.probability = parseFloat(row.probability);
        if (row.expected_close_date) opp.expected_close_date = row.expected_close_date;
        if (row.last_activity_date) opp.last_activity_date = row.last_activity_date;
        if (row.next_action) opp.next_action = row.next_action;
        if (row.next_action_due_date) opp.next_action_due_date = row.next_action_due_date;

        const { error: oppErr } = await supabase
          .schema("drift")
          .from("opportunities")
          .insert(opp);

        if (oppErr) {
          rowErrors.push(`Row ${rowNum}: failed to create opportunity "${oppTitle}" — ${oppErr.message}`);
        } else {
          successCount++;
        }
      } catch (e) {
        rowErrors.push(`Row ${rowNum}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const finalStatus =
      rowErrors.length === 0 ? "completed" :
      successCount > 0 ? "partial" : "failed";

    await supabase
      .schema("drift")
      .from("import_batches")
      .update({
        status: finalStatus,
        successful_rows: successCount,
        failed_rows: dataLines.length - successCount,
        error_log: rowErrors.length > 0 ? { errors: rowErrors } : null,
      })
      .eq("id", batchId);

    return NextResponse.json(
      {
        batch_id: batchId,
        status: finalStatus,
        total_rows: dataLines.length,
        successful_rows: successCount,
        failed_rows: dataLines.length - successCount,
        ...(rowErrors.length > 0 && { errors: rowErrors }),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected import error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/drift/import — list recent import batches
export async function GET() {
  try {
    const { data, error } = await supabase
      .schema("drift")
      .from("import_batches")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch import batches", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ batches: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
