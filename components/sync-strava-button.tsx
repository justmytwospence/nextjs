"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { getStravaCapacity } from "@/app/actions/getCapacity";
import type { Capacity } from "@/app/actions/getCapacity";
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
  currentPage: number;
}

export default function SyncStravaButton() {
  const BATCH_LIMIT = 10;
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [capacity, setCapacity] = useState<Capacity>({
    shortTerm: {
      remaining: 0,
      total: 0,
      windowSeconds: 15
    },
    daily: {
      remaining: 0,
      total: 0
    }
  });

  const [progress, setProgress] = useState<ProgressState>({
    message: "Starting Sync...",
    currentItem: 1,
    totalItems: 0,
    failedItems: [],
    currentPage: 1,
  });

  async function syncBatch(page: number = 1, pageSize: number = 2) {
    return new Promise((resolve, reject) => {
      const events = new EventSource(`/api/sync-batch?page=${page}&page_size=${pageSize}`);

      events.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "start":
            setProgress(prev => ({
              ...prev,
              totalItems: data.n,
              currentItem: 0,  // Reset to 0 when starting
            }));
            break;
          case "update":
            setProgress(prev => ({
              ...prev,
              message: data.message,
              currentItem: prev.currentItem + 1,
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
            resolve(true);
            router.refresh();
            break;
          case "error":
            events.close();
            setProgress(prev => ({
              ...prev,
              message: `Sync Failed: ${JSON.stringify(data.error, null, 2)}`,
            }));
            setIsSyncing(false);
            reject(new Error(data.error));
            break;
        }
      };

      events.onerror = (error) => {
        events.close();
        setIsSyncing(false);
        reject(error);
      };
    });
  };

  async function sync() {
    const PAGE_SIZE = 20;
    const BATCH_SIZE = 2 + (PAGE_SIZE * 2);

    setIsSyncing(true);

    setProgress({
      currentPage: 1,
      currentItem: 0,  // Start from 0
      totalItems: 0,
      message: "Sync starting...",
      failedItems: []
    });

    let currentPage = 1;
    while (currentPage <= BATCH_LIMIT) {
      const capacity = await getStravaCapacity();
      setCapacity(capacity);
      if (capacity.shortTerm.remaining >= BATCH_SIZE && capacity.daily.remaining >= BATCH_SIZE) {
        await syncBatch(currentPage, PAGE_SIZE);
        currentPage++;
        setProgress(prev => ({ ...prev, currentPage }));
      }
    }
    setIsSyncing(false);
  };

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
                <Progress value={(progress.currentItem / progress.totalItems) * 100} />
              )}
              <p className="text-sm text-muted-foreground">{progress.message}</p>
              <p className="text-xs text-muted-foreground">
                API Capacity: {capacity.shortTerm.remaining} short-term, {capacity.daily.remaining} today
              </p>
            </div>
          </PopoverContent>
        </div>
      </Popover>

      <Dialog open={showModal} onOpenChange={() => setShowModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSyncing
                ? `Syncing page ${progress.currentPage} / ${BATCH_LIMIT}`
                : "Sync Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {progress.totalItems > 0 && (
                <Progress value={(progress.currentItem / progress.totalItems) * 100} />
              )}
              <p className="text-sm text-muted-foreground">{progress.message}</p>
              {progress.details && (
                <p className="text-sm text-muted-foreground">{progress.details}</p>
              )}
              {progress.failedItems.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-destructive">Failed items:</p>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {progress.failedItems.map((item, i) => (
                      <li key={i}>{item.name}: {item.error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                API Capacity: {capacity.shortTerm.remaining} short-term, {capacity.daily.remaining} today
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}