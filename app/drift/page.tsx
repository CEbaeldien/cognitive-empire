import { getDriftOverview } from "@/lib/drift/data";
import DriftDashboard from "@/app/admin/drift/DriftDashboard";

export default async function DriftPage() {
  const data = await getDriftOverview();
  return <DriftDashboard data={data} />;
}
