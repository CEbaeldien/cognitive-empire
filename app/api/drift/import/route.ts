import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const workspaceId = process.env.DRIFT_WORKSPACE_ID;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!workspaceId) throw new Error("Missing DRIFT_WORKSPACE_ID");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const REQUIRED_COLUMNS = ["title", "account_name"];
const OPTIONAL_COLUMNS = [
  "value",
  "currency",
  "stage",
  "probability",
  "expected_close_date",
  "last_activity_date",
  "next_action",
  "next_action_due_date",
  "contact_name",
  "industry",
];
const ALL_KNOWN_COLUMNS = new Set([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]);

function parseCSVHeaders(headerLine: string): string[] {
  return headerLine
    .split(",")
    .map((col) => col.trim().replace(/^"|"$/g, "").toLowerCase());
}

// POST /api/drift/import — upload CSV, validate columns, create import batch
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
      return NextResponse.json(
        { error: "No file uploaded. Send a CSV as 'file' in the form data." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a .csv" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length === 0) {
      return NextResponse.json({ error: "CSV file is empty." }, { status: 400 });
    }

    const detectedColumns = parseCSVHeaders(lines[0]);
    const totalRows = Math.max(0, lines.length - 1);

    const missingRequired = REQUIRED_COLUMNS.filter(
      (col) => !detectedColumns.includes(col)
    );
    const optionalPresent = OPTIONAL_COLUMNS.filter((col) =>
      detectedColumns.includes(col)
    );
    const unmappedColumns = detectedColumns.filter(
      (col) => !ALL_KNOWN_COLUMNS.has(col)
    );

    const isValid = missingRequired.length === 0;

    const mapping = {
      detected_columns: detectedColumns,
      required_columns: REQUIRED_COLUMNS,
      optional_columns_present: optionalPresent,
      unmapped_columns: unmappedColumns,
    };

    const errorLog = !isValid
      ? {
          validation_errors: missingRequired.map(
            (col) => `Missing required column: "${col}"`
          ),
        }
      : null;

    const { data: batch, error: insertError } = await supabase
      .schema("drift")
      .from("import_batches")
      .insert({
        workspace_id: workspaceId,
        import_source: "csv",
        file_name: file.name,
        status: isValid ? "pending" : "failed",
        total_rows: totalRows,
        successful_rows: 0,
        failed_rows: isValid ? 0 : totalRows,
        mapping,
        error_log: errorLog,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create import batch", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        batch,
        validation: {
          valid: isValid,
          total_rows: totalRows,
          detected_columns: detectedColumns,
          missing_required: missingRequired,
          optional_present: optionalPresent,
          unmapped_columns: unmappedColumns,
        },
      },
      { status: isValid ? 201 : 422 }
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

// GET /api/drift/import — list import batches for the workspace
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
