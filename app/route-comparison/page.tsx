import { auth } from "@/auth";
import { queryMappableActivities, queryRoutes } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { redirect } from "next/navigation";
import RouteComparison from "./client";

export default async function RouteComparisonPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const routes = (await queryRoutes(session.user.id)).map(({ id, name }) => ({
    id: id.toString(),
    name,
  }));

  const mappableActivities = (
    await queryMappableActivities(session.user.id)
  ).map(({ id, name }) => ({ id: id.toString(), name }));

  baseLogger.info(
    `Initial routes for comparison page: ${JSON.stringify(routes, null, 2)}`
  );

  return <RouteComparison routes={routes} activities={mappableActivities} />;
}
