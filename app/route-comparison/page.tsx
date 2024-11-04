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
  console.log("initial routes", initialRoutes)

  if (initialRoutes.length === 0) {
    return (
      <p className="text-center text-2xl font-bold mt-10">
        No routes found. Please sync with Strava!
      </p>
    )
  }
  return (
    <RouteComparison routes={initialRoutes} />
  );
}