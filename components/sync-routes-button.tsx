import syncRoutes from "@/app/actions/syncRoutes";
import { Button } from "@/components/ui/button";
import { baseLogger } from "@/lib/logger";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { Session } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";

export default function SyncRoutesButton() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncRoutes = async () => {
    try {
      setIsSyncing(true);
      await syncRoutes();
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast.success("Routes synced successfully");
    } catch (error) {
      baseLogger.error("Failed to sync routes:", error);
      toast.error("Failed to sync routes");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSyncRoutes} disabled={isSyncing}>
      {isSyncing ? (
        <>
          Syncing
          <Loader className="animate-spin h-4 w-4 ml-2" />
        </>
      ) : (
        "Sync Routes"
      )}
    </Button>
  );
}
