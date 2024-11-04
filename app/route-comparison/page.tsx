import { auth } from "@/auth";
import RouteComparison from "./client"
import { queryUserRoutes } from "@/lib/db";
import { createSessionLogger } from "@/lib/logger";

export default async function RouteComparisonPage() {
  const session = await auth();
  if (!session) { 
    return null;
  }
  const sessionLogger = createSessionLogger(session)
  const initialRoutes = (await queryUserRoutes(session)).map(({ id, name }) => ({ id, name }));
  sessionLogger.info(initialRoutes);

  return (
    <RouteComparison routes={initialRoutes} />
  );
}