import { auth } from "@/auth";
import { queryUserRoutes } from "@/lib/db";
import RoutesGrid from "./routes-grid";
import { baseLogger } from "@/lib/logger";

export default async function RoutesPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const routes = await queryUserRoutes(session.user.id);
  baseLogger.info(`Found ${routes.length} routes`);
  return <RoutesGrid routes={routes} />;
}
