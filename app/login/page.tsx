import LoginButton from "@/components/login-button";
import Image from "next/image";
import hero from "./login-form-image.jpeg";

export default async function LoginPage({ searchParams }) {
  const { redirectUrl = "" } = await searchParams;

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${hero.src})` }}>
      <div className="flex items-center justify-center h-full">
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg w-[350px]">
          <div className="grid gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Login</h1>
            </div>
            <div className="grid gap-8"> {/* Increased gap from 4 to 8 */}
              <LoginButton redirectUrl={redirectUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
