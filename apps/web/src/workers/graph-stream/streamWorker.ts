import { StreamWorkerMessage, StreamConfig } from "./streamWorker.types";

export class StreamWorkerService {
  private worker: Worker | null = null;

  constructor() {
    // Only create Worker in browser environment
    if (typeof window !== "undefined") {
      this.worker = new Worker(new URL("./stream.worker.ts", import.meta.url));
    }
  }

  async *streamData(config: StreamConfig): AsyncGenerator<any, void, unknown> {
    if (!this.worker) {
      throw new Error("Worker not available - must be called in browser environment");
    }

    this.worker.postMessage(config);

    while (true) {
      const event: MessageEvent<StreamWorkerMessage> = await new Promise(
        (resolve) => {
          this.worker!.onmessage = resolve;
        }
      );

      const { type, data, error } = event.data;

      if (type === "error") {
        throw new Error(error);
      }

      if (type === "chunk" && data) {
        yield JSON.parse(data);
      }

      if (type === "done") {
        break;
      }
    }
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
