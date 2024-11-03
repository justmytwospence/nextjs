import { auth } from "@/auth";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { queryUserRoutes, queryRoute } from "@/lib/db";
import { createSessionLogger } from "@/lib/logger";

export default async function RouteComparisonPage() {
  const session = await auth();
  const sessionLogger = createSessionLogger(session)
  const initialRoutes = (await queryUserRoutes(session)).map(({ id, name }) => ({ id, name }));
  sessionLogger.info(initialRoutes);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <RouteComparisonColumn
        routes={initialRoutes}
      />
      <RouteComparisonColumn
        routes={initialRoutes}
      />
    </div>
  );
}