import syncActivities from "@/app/actions/syncActivities";
import { Button } from "@/components/ui/button";
import { baseLogger } from "@/lib/logger";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SyncActivitiesButton() {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState<number | null>(null);

  const handleSyncActivities = async () => {
    try {
      setIsSyncing(true);
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        setCurrentPage(page);
        hasMore = await syncActivities(page);
        page++;
      }
      toast.success("Activities synced successfully");
    } catch (error) {
      baseLogger.error("Failed to sync activities:", error);
      toast.error("Failed to sync activities");
    } finally {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setIsSyncing(false);
      setCurrentPage(null);
    }
  };

  return (
    <Button onClick={handleSyncActivities} disabled={isSyncing}>
      {isSyncing ? (
        <>
          Syncing page {currentPage}
          <Loader className="animate-spin h-4 w-4 ml-2" />
        </>
      ) : (
        "Sync Activities"
      )}
    </Button>
  );
}
