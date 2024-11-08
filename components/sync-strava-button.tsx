"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ProgressState = {
  message: string;
  details?: string;
  currentItem: number;
  totalItems: number;
  failedItems: {
    name: string;
    error: string;
  }[];
}

export default function SyncStravaButton() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [progress, setProgress] = useState<ProgressState>({
    message: "Starting Sync...",
    currentItem: 1,
    totalItems: 1,
    failedItems: [],
  });

  async function sync() {
    setIsSyncing(true);
    setProgress({
      currentItem: 0,
      totalItems: 0,
      message: "Sync starting...",
      failedItems: []
    });

    const events = new EventSource("/api/stream-sync?type=activities");

    events.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "start":
          setProgress(prev => ({
            ...prev,
            totalItems: data.n,
            message: data.message
          }));
          break;
        case "update":
          setProgress(prev => ({
            ...prev,
            message: data.message,
            currentItem: Math.min(prev.currentItem + 1, prev.totalItems)
          }));
          break;
        case "fail":
          setProgress(prev => ({
            ...prev,
            currentItem: prev.currentItem + 1,
            failedItems: [
              ...prev.failedItems,
              { name: data.route, error: data.error }
            ],
          }));
          break;
        case "complete":
          events.close();
          setProgress(prev => ({
            ...prev,
            message: "Sync Complete",
          }));
          setIsSyncing(false);
          router.refresh();
          // Close modal only if there were no failures
          if (progress.failedItems.length === 0) {
            setShowModal(false);
          }
          break;
      }
    };

    events.onerror = () => {
      events.close();
      setProgress(prev => ({
        ...prev,
        message: "Sync Failed: Connection error",
      }));
      setIsSyncing(false);
    };
  }

  return (
    <>
      <Popover open={isHovered && (isSyncing)}>
        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <PopoverTrigger asChild>
            <Button
              className="ml-auto"
              onClick={() => {
                if (isSyncing) {
                  setShowModal(true);
                } else {
                  sync();
                  setShowModal(true);
                }
              }}>
              {isSyncing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Syncing...
                </>
              ) : ("Sync Strava")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" sideOffset={5}>
            <div className="space-y-2">
              {progress.totalItems > 0 && (
                <>
                  <Progress value={(progress.currentItem / progress.totalItems) * 100} />
                </>
              )}
              <p className="text-sm text-muted-foreground">{progress.message}</p>
            </div>
          </PopoverContent>
        </div>
      </Popover>

      <Dialog open={showModal} onOpenChange={() => setShowModal(false)}>
        <DialogContent className="max-w-[90vw] md:max-w-[600px] overflow-hidden w-full">
          <DialogHeader>
            <DialogTitle>
              {isSyncing ? "Syncing" : "Sync Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {progress.totalItems > 0 && (
              <Progress value={(progress.currentItem / progress.totalItems) * 100} />
            )}
            <p className="text-sm text-muted-foreground break-words">{progress.message}</p>
            {progress.details && (
              <p className="text-sm text-muted-foreground break-words">{progress.details}</p>
            )}
            {progress.failedItems.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-destructive mb-2">{progress.failedItems.length} Failed items:</p>
                <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden rounded-md border border-border p-4 space-y-2">
                  {progress.failedItems.map((item, i) => (
                    <div key={i} className="space-y-1 w-full">
                      <p className="text-sm font-bold break-words">{item.name}</p>
                      <pre className="text-xs bg-muted p-2 rounded-md whitespace-pre-wrap break-all w-full">
                        <code>
                          {typeof item.error === 'string'
                            ? item.error
                            : JSON.stringify(item.error, null, 2)}
                        </code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};