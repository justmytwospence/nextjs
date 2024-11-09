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
      <div className="text-center">
        Not signed in <br />
      </div>
      <Button className="w-full" type="submit">Sign in with Strava</Button>
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
      <div className="text-center mb-4">
        Signed in as {session.user.name} <br />
      </div>
      <Button className="w-full" type="submit">Sign Out</Button>
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