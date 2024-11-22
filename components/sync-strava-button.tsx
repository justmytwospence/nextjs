"use client";

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
import { baseLogger } from "@/lib/logger";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProgressState = {
  message: string;
  details?: string;
  currentItem: number;
  totalItems: number;
  failedItems: {
    name: string;
    error: string;
  }[];
};

export default function SyncStravaButton({ type }: { type: string }) {
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
      failedItems: [],
    });

    const events = new EventSource(`/api/sync-${type}`);

    events.onmessage = (event) => {
      baseLogger.info(`Received event: ${event.data}`);
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "update_total":
          setProgress((prev) => ({
            ...prev,
            totalItems: data.n,
            currentItem: 0,
            message: data.message,
          }));
          break;
        case "update_current":
          setProgress((prev) => ({
            ...prev,
            currentItem: Math.min(prev.currentItem + 1, prev.totalItems),
            message: data.message,
          }));
          break;
        case "update_failed":
          setProgress((prev) => ({
            ...prev,
            failedItems: [
              ...prev.failedItems,
              { name: data.name, error: data.error },
            ],
          }));
          break;
        case "update_message":
          setProgress((prev) => ({
            ...prev,
            message: data.message,
          }));
          break;
        case "complete":
          events.close();
          setProgress((prev) => ({
            ...prev,
            message: data.error,
          }));
          setIsSyncing(false);
          if (!data.error && progress.failedItems.length === 0) {
            setShowModal(false);
          }
          router.refresh();
          break;
      }
    };

    events.onerror = () => {
      events.close();
      setProgress((prev) => ({
        ...prev,
        message: "Sync Failed: Connection error",
      }));
      setIsSyncing(false);
    };
  }

  return (
    <>
      <Popover open={isHovered && isSyncing}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <PopoverTrigger asChild>
            <Button
              className="ml-auto font-bold"
              onClick={() => {
                if (isSyncing) {
                  setShowModal(true);
                } else {
                  sync();
                  setShowModal(true);
                }
              }}
            >
              {isSyncing ? (
                <>
                  <Spinner className="mr-2" />
                  Syncing {type.charAt(0).toUpperCase() + type.slice(1)}...
                  {progress.totalItems > 0 &&
                    ` (${progress.currentItem}/${progress.totalItems})`}
                </>
              ) : (
                `Sync ${type.charAt(0).toUpperCase() + type.slice(1)}`
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" sideOffset={5}>
            <div className="space-y-2">
              {progress.totalItems > 0 && (
                <>
                  <Progress
                    value={(progress.currentItem / progress.totalItems) * 100}
                  />
                </>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                {progress.message}
              </p>
            </div>
          </PopoverContent>
        </div>
      </Popover>

      <Dialog open={showModal} onOpenChange={() => setShowModal(false)}>
        <DialogContent className="max-w-[90vw] md:max-w-[600px] overflow-hidden w-full">
          <DialogHeader>
            <DialogTitle>
              {isSyncing ? "Syncing..." : "Sync Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {progress.totalItems > 0 && (
              <Progress
                value={(progress.currentItem / progress.totalItems) * 100}
              />
            )}
            <p className="text-sm text-muted-foreground break-words mt-4">
              {progress.message}
            </p>
            {progress.details && (
              <p className="text-sm text-muted-foreground break-words">
                {progress.details}
              </p>
            )}
            {progress.failedItems.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-destructive mb-2">
                  {progress.failedItems.length} Failed items:
                </p>
                <div className="max-h-[40vh] overflow-y-auto overflow-x-hidden rounded-md border border-border p-4 space-y-2">
                  {progress.failedItems.map((item, i) => (
                    <div key={i} className="space-y-1 w-full">
                      <p className="text-sm font-bold break-words">
                        {item.name}
                      </p>
                      <pre className="text-xs bg-muted p-2 rounded-md whitespace-pre-wrap break-all w-full">
                        <code>
                          {typeof item.error === "string"
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
}
