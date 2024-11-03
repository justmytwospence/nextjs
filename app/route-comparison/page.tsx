import { auth } from "@/auth";
import RouteComparison from "./client"
import { queryUserRoutes, queryRoute } from "@/lib/db";
import { createSessionLogger } from "@/lib/logger";
import { StravaRoute } from "@prisma/client";
import { Route } from "lucide-react";

export default async function RouteComparisonPage({ routes }: { routes: StravaRoute[] }) {
  const session = await auth();
  const sessionLogger = createSessionLogger(session)
  const initialRoutes = (await queryUserRoutes(session)).map(({ id, name }) => ({ id, name }));
  sessionLogger.info(initialRoutes);

  return (
    <RouteComparison routes={initialRoutes} />
  );
}