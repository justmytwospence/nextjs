import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { createSessionLogger } from "@/lib/logger";

export function SignIn({ redirectUrl }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("strava", { redirectTo: redirectUrl });
      }}
    >
      <Button className="w-full font-bold" type="submit">
        Sign in with Strava
      </Button>
    </form>
  );
}

export function SignOut({ session }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button className="w-full font-bold" type="submit">
        Sign Out
      </Button>
    </form>
  );
}

export default async function LoginButton({ redirectUrl }) {
  const session = await auth();
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Session: ${JSON.stringify(session, null, 2)}`);
  if (session) {
    return <SignOut session={session} />;
  }
  return <SignIn redirectUrl={redirectUrl} />;
}
