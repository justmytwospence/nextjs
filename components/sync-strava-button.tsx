'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function SyncStravaButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progressSummary, setProgressSummary] = useState<{
    currentRoute: string,
    failed: number,
    failedRoutes: Array<{ name: string, error: string }>,
    message: string,
    progress: number,
    succeeded: number,
    total: number
  }>({
    currentRoute: "",
    failed: 0,
    failedRoutes: [],
    message: "",
    progress: 0,
    succeeded: 0,
    total: 0,
  });

  const handleButtonClick = () => {
    if (isLoading) {
      setShowModal(true);
    } else {
      startSync();
    }
  };

  const startSync = useCallback(async () => {
    setIsLoading(true);
    setShowModal(true);

    const events = new EventSource('/api/sync-strava');

    events.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'fetch':
          setProgressSummary(prev => ({
            ...prev,
            total: data.nRoutes,
            message: `Fetching ${data.nRoutes} routes from Strava...`,
          }));
          break;
        case 'route':
          setProgressSummary(prev => ({
            ...prev,
            currentRoute: data.route,
            message: `Syncing route ${data.route}...`,
          }));
          break;
        case 'segment':
          setProgressSummary(prev => ({
            ...prev,
            message: `Syncing segment ${data.segment}...`,
          }));
          break;
        case 'success':
          setProgressSummary(prev => ({
            ...prev,
            message: `Successfully synced ${data.route}`,
            progress: prev.progress + 1,
            succeeded: prev.succeeded + 1
          }));
          break;
        case 'fail':
          setProgressSummary(prev => ({
            ...prev,
            message: `Failed to sync ${data.route}: ${data.error}`,
            progress: prev.progress + 1,
            failed: prev.failed + 1,
            failedRoutes: [
              ...prev.failedRoutes,
              {
                name: data.route,
                error: data.error
              }
            ]
          }));
          break;
        case 'complete':
          setProgressSummary(prev => ({
            ...prev,
            message: `Synced ${data.nRoutes} routes from Strava`,
          }));
          events.close();
          setIsLoading(false);
          router.refresh();
          break;
        case 'error':
          events.close();
          console.log("not using the onerror handler")
          setProgressSummary(prev => ({
            ...prev,
            message: `An error occurred during sync: ${data.error}`,
          }));
          setIsLoading(false);
          // router.refresh();
          break;
      }
    };

  }, []);

  const PopoverProgress = ({ progressSummary }) => progressSummary?.total ? (
    <div className="space-y-2">
      <Progress value={(progressSummary.progress / progressSummary.total) * 100} />
      <p className="text-sm text-muted-foreground">
        {progressSummary.message}
      </p>
    </div>
  ) : null;

  const ModalProgress = ({ progressSummary }) => progressSummary?.total ? (
    <div className="space-y-2">
      <Progress value={(progressSummary.progress / progressSummary.total) * 100} />
      <p className="text-sm text-muted-foreground">
        {progressSummary.message}
      </p>
      {progressSummary.failedRoutes.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-destructive">Failed routes:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-4">
            {progressSummary.failedRoutes.map((failedRoute, i) => (
              <li key={i}>{failedRoute.name}: {failedRoute.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <Popover open={isHovered}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <PopoverTrigger asChild>
            <Button
              className="ml-auto"
              onClick={handleButtonClick}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Syncing...
                </>
              ) : (
                "Sync Strava"
              )}
            </Button>
          </PopoverTrigger>
          {isLoading && (
            <PopoverContent className="w-80" sideOffset={5}>
              <PopoverProgress progressSummary={progressSummary} />
            </PopoverContent>
          )}
        </div>
      </Popover>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isLoading ? "Syncing Strava Routes" : "Sync Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ModalProgress progressSummary={progressSummary} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}