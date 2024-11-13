import { auth } from "@/auth";
import RouteComparison from "./client"
import { queryMappables } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import PleaseSync from "@/components/please-sync";

export default async function RouteComparisonPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const initialMappables = (await queryMappables(session.user.id)).map(({ id, name, type }) => ({ id, name, type }));
  baseLogger.info(`Initial mappables for comparison page: ${JSON.stringify(initialMappables, null, 2)}`);

  if (initialMappables.length === 0) {
    return (<PleaseSync />)
  }
  return (
    <RouteComparison mappables={initialMappables} />
  );
}