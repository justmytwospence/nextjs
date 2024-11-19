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

export async function createSyncEndpoint(syncFunction: SyncFunction): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const syncContext: SyncContext = {
    send: async (message: Message) => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
      } catch (error) {
        baseLogger.error(`Failed to write to stream: ${error}`);
        throw error;
      }
    }
  }

  // Start the response immediately
  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  // Sync in the background
  syncFunction(session.user.id, syncContext).finally(() => writer.close());

  return response;
}
