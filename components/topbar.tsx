"user server";

import { auth } from "@/auth";
import TopbarClient from "./topbar.client";
import { redirect } from "next/navigation";

export default async function Topbar() {
  const session = await auth();

  if (!session) {
    redirect("/login")
  }

  return <TopbarClient session={session} />;
}
