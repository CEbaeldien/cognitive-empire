import { getDriftOverview } from "@/lib/drift/data";
import DriftDashboard from "./DriftDashboard";

export default async function DriftAdminPage() {
  const data = await getDriftOverview();
  return <DriftDashboard data={data} />;
}
