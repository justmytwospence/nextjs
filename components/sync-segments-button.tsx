import syncSegments from "@/app/actions/syncSegments";
import { Button } from "@/components/ui/button";
import { baseLogger } from "@/lib/logger";
import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SyncSegmentsButton({segmentIds}: {segmentIds: string[]}) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncSegments = async () => {
    try {
      setIsSyncing(true);
      toast.dismiss();
      const syncToastId = toast.message("Syncing segments...");
      const generator = await syncSegments(segmentIds);
      for await (const result of generator) {
        switch (result.type) {
          case "error":
            toast.error(result.message);
            break;
          case "info":
            toast.message(result.message);
            break;
          case "success":
            toast.success(result.message);
            break;
          case "warning":
            toast.warning(result.message);
            break;
        }
      }
      toast.dismiss(syncToastId);
    } catch (error) {
      baseLogger.error("Failed to sync segments:", error);
      toast.error(`Failed to sync segments: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSyncSegments} disabled={isSyncing}>
      {isSyncing ? (
        <>
          Syncing
          <Loader className="animate-spin h-4 w-4 ml-2" />
        </>
      ) : (
        "Sync Segments"
      )}
    </Button>
  );
}
