import { getDriftOverview } from "@/lib/drift/data";
import WorkspaceDashboard from "./WorkspaceDashboard";

export default async function WorkspacePage() {
  const data = await getDriftOverview();
  return <WorkspaceDashboard data={data} />;
}
