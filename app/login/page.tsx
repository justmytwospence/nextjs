import { auth } from "@/auth";
import LoginButton from "@/components/login-button";
import Image from "next/image";
import hero from "./login-form-image.jpeg";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default async function LoginPage({ searchParams }) {
  const { redirectUrl = "" } = await searchParams;
  const session = await auth();

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${hero.src})` }}>
      <div className="flex items-center justify-center h-full">
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg w-[350px]">
          <div className="grid gap-6">
            <div className="grid gap-2 text-center">
              {session?.user ? (
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarImage src={session.user.image} alt={session.user.name || "User avatar"} />
                </Avatar>
              ) : (
                <h1 className="text-3xl font-bold">Login</h1>
              )}
            </div>
            <div className="grid gap-8">
              <LoginButton redirectUrl={redirectUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
