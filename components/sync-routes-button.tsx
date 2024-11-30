import syncRoutes from "@/app/actions/syncRoutes";
import { Button } from "@/components/ui/button";
import { baseLogger } from "@/lib/logger";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SyncRoutesButton() {
	const queryClient = useQueryClient();
	const [isSyncing, setIsSyncing] = useState(false);

	const handleSyncRoutes = async () => {
		try {
			setIsSyncing(true);
      const syncToastId = toast.message("Syncing routes...")
			const generator = await syncRoutes();
			for await (const result of generator) {
        switch (result.type) {
          case "error":
            toast.error(result.message)
            break;
          case "info":
            toast.message(result.message)
            break;
          case "success":
            toast.success(result.message)
            break;
          case "warning":
            toast.warning(result.message)
            break;
        }
			}
      toast.dismiss(syncToastId)
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.some(
            (key) => typeof key === "string" && key.includes("routes")
          ),
      });
		} catch (error) {
			baseLogger.error("Failed to sync routes:", error);
			toast.error(`Failed to sync routes: ${error}`);
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
