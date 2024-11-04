import { auth } from "@/auth";
import RouteComparison from "./client"
import { queryUserRoutes } from "@/lib/db";
import { createSessionLogger } from "@/lib/logger";
import PleaseSync from "@/components/please-sync";

export default async function RouteComparisonPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const sessionLogger = createSessionLogger(session)
  const initialRoutes = (await queryUserRoutes(session)).map(({ id, name }) => ({ id, name }));
  sessionLogger.info(`Initial routes for comparison page: ${JSON.stringify(initialRoutes, null, 2)}`);

  if (initialRoutes.length === 0) {
    return (<PleaseSync />)
  }
  return (
    <RouteComparison routes={initialRoutes} />
  );
}