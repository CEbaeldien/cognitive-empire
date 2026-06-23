import { requireFounder } from "@/utils/supabase/server";
import { getDriftOverview } from "@/lib/drift/data";
import DriftDashboard from "./DriftDashboard";

export default async function DriftAdminPage() {
  await requireFounder();
  const data = await getDriftOverview();
  return <DriftDashboard data={data} />;
}
