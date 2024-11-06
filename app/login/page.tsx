import LoginButton from "@/components/login-button";
import Image from "next/image";
import hero from "./login-form-image.jpeg";

export default async function LoginPage({ searchParams }) {
  const { redirectUrl = "" } = await searchParams;

  return (
    <div className="flex h-screen w-full lg:grid lg:grid-cols-2 pt-16">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
          </div>
          <div className="grid gap-4">
            <LoginButton redirectUrl={redirectUrl} />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src={hero}
          alt="Hero Image"
          layout="fill"
          objectFit="cover"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
