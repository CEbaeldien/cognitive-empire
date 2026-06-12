import { getDriftOverview, getDriftInterventions } from "@/lib/drift/data";
import InterventionsBoard from "./InterventionsBoard";

export default async function InterventionsPage() {
  const [overview, interventions] = await Promise.all([
    getDriftOverview(),
    getDriftInterventions(),
  ]);
  return <InterventionsBoard overview={overview} interventions={interventions} />;
}
