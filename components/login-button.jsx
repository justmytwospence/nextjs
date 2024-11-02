import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

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
      <Button className="w-full" type="submit">Sign in</Button>
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
      <div className="text-center">
        Signed in as {session.user.name} <br />
      </div>
      <Button className="w-full" type="submit">Sign Out</Button>
    </form>
  );
}

export default async function LoginButton({ redirectUrl }) {
  const session = await auth();
  if (session) {
    return <SignOut session={session} />;
  }
  return <SignIn redirectUrl={redirectUrl} />;
}