import { auth } from "@/auth";
import PleaseSync from "@/components/please-sync";
import { queryMappables, queryUserRoutes } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { redirect } from "next/navigation";
import RouteComparison from "./client";

export default async function RouteComparisonPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const initialMappables = (await queryUserRoutes(session.user.id)).map(
    ({ id, name, type }) => ({ id, name, type: "route" })
  );
  baseLogger.info(
    `Initial mappables for comparison page: ${JSON.stringify(
      initialMappables,
      null,
      2
    )}`
  );

  if (initialMappables.length === 0) {
    return <PleaseSync />;
  }
  return <RouteComparison mappables={initialMappables} />;
}
