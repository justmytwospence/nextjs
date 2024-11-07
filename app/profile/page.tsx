import { auth } from "@/auth";
import SyncStravaButton from "@/components/sync-strava-button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h2 className="text-xl font-semibold">Strava Routes</h2>
            <p className="text-muted-foreground">Sync your routes from Strava</p>
          </div>
          <SyncStravaButton />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h2 className="text-xl font-semibold">Strava Activities</h2>
            <p className="text-muted-foreground">Sync your activities from Strava</p>
          </div>
          <SyncStravaButton />
        </div>
      </div>
    </div>
  );
}
