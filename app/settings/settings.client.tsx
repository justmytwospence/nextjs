"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/lib/settings-store";

export default function SettingsClient({ session }: { session: any }) {
  const { runnableGradient, setRunnableGradient } = useSettings();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={session?.user?.image} alt="Profile" />
              <AvatarFallback>
                {session?.user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{session?.user?.name}</h2>
              <p className="text-gray-500">{session?.user?.email}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Runnable Gradient (%)
                </label>
                <Slider
                  value={[runnableGradient]}
                  onValueChange={([value]) => setRunnableGradient(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-[60%]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
