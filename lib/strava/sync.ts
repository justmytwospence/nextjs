import { auth } from "@/auth";
import { baseLogger } from "@/lib/logger";
import { NextResponse } from "next/server";

type Message = | { type: "update_total"; message: string; n: number }
  | { type: "update_current"; message: string }
  | { type: "update_failed"; name: string; error: string }
  | { type: "update_message"; message: string }
  | { type: "complete"; error?: string };

export interface SyncContext {
  send: (message: Message) => Promise<void>;
}

type SyncFunction = (userId: string, context: SyncContext) => Promise<void>;

export async function createSyncEndpoint(userId: string, syncFunction: SyncFunction): Promise<NextResponse> {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const syncContext: SyncContext = {
    send: async (message: Message) => {
      try {
        baseLogger.info(`${JSON.stringify(message)}`);
        await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      } catch (error) {
        baseLogger.error(`Failed to write to stream: ${error}`);
        throw error;
      }
    }
  };

  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  async function handleSyncError(error: unknown) {
    baseLogger.error("Sync failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await syncContext.send({
      type: "complete",
      error: errorMessage,
    });
  }

  async function closeWriter() {
    await writer.close();
  }

  syncFunction(userId, syncContext)
    .catch(handleSyncError)
    .finally(closeWriter);

  return response;
}
