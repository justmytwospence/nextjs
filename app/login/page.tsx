import { auth } from "@/auth";
import LoginButton from "@/components/login-button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import hero from "./login-form-image.jpeg";

export default async function LoginPage({ searchParams }) {
  const { redirectUrl = "" } = await searchParams;
  const session = await auth();

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center"
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg w-[350px]">
        <div className="grid gap-6">
          
            {session?.user ? (
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name || "User avatar"}
                />
              </Avatar>
            ) : (
              <h1 className="text-3xl font-bold">Login</h1>
            )}
          
          <div className="grid gap-8">
            <LoginButton redirectUrl={redirectUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
