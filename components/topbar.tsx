"user server";

import { auth } from "@/auth";
import TopbarClient from "./topbar.client";

export default async function Topbar() {
  const session = await auth();
  return <TopbarClient session={session} />;
}
