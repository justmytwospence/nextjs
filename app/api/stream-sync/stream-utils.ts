
import { baseLogger } from "@/lib/logger";

type Message =
  | { type: "update_total", message: string, n: number }
  | { type: "update_current", message: string }
  | { type: "update_failed", name: string, error: string }
  | { type: "update_message", message: string }
  | { type: "complete", error?: string }

class StreamManager {
  private static instance: StreamManager;
  private writer?: WritableStreamDefaultWriter<any>;
  private encoder = new TextEncoder();

  private constructor() { }

  static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  setWriter(writer: WritableStreamDefaultWriter<any>) {
    this.writer = writer;
  }

  async send(message: Message) {
    if (!this.writer) {
      throw new Error("Writer not initialized");
    }
    try {
      await this.writer.write(this.encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
    } catch (error) {
      baseLogger.error(`Failed to write to stream: ${error}`);
      throw error;
    }
  }
}

export const streamManager = StreamManager.getInstance();