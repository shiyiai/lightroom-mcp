import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Dispatcher, PluginResponse } from "./dispatcher.js";

export interface DaemonServerOptions {
  host: string;
  port: number;
  dispatcher: Pick<Dispatcher, "call" | "pendingCount">;
  isReady: () => boolean;
  requestPort: number;
  responsePort: number;
  log?: (msg: string) => void;
}

interface QueueEntry {
  action: string;
  params: unknown;
  resolve: (resp: PluginResponse) => void;
  reject: (err: Error) => void;
}

export class LightroomDaemonServer {
  private readonly opts: DaemonServerOptions;
  private readonly log: (msg: string) => void;
  private readonly server: http.Server;
  private readonly queue: QueueEntry[] = [];
  private running = false;

  constructor(opts: DaemonServerOptions) {
    this.opts = opts;
    this.log = opts.log ?? ((msg: string) => console.error(msg));
    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res);
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onError = (err: Error) => {
        this.server.off("listening", onListening);
        reject(err);
      };
      const onListening = () => {
        this.server.off("error", onError);
        const addr = this.server.address() as AddressInfo;
        this.log(`Lightroom daemon listening on http://${this.opts.host}:${addr.port}`);
        resolve();
      };
      this.server.once("error", onError);
      this.server.once("listening", onListening);
      this.server.listen(this.opts.port, this.opts.host);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  address(): AddressInfo | null {
    const addr = this.server.address();
    return typeof addr === "object" ? addr : null;
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (req.method === "GET" && req.url === "/status") {
      this.writeJson(res, 200, {
        ok: true,
        ready: this.opts.isReady(),
        pending: this.opts.dispatcher.pendingCount(),
        queue: this.queue.length + (this.running ? 1 : 0),
        requestPort: this.opts.requestPort,
        responsePort: this.opts.responsePort,
      });
      return;
    }

    if (req.method === "POST" && req.url === "/call") {
      await this.handleCall(req, res);
      return;
    }

    this.writeJson(res, 404, { error: "Not found" });
  }

  private async handleCall(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    let body: string;
    try {
      body = await readBody(req, 10 * 1024 * 1024);
    } catch (err) {
      this.writeJson(res, 413, { error: err instanceof Error ? err.message : String(err) });
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      this.writeJson(res, 400, { error: "Request body must be JSON" });
      return;
    }

    if (!isCallRequest(parsed)) {
      this.writeJson(res, 400, { error: "Request body must contain string action and optional params" });
      return;
    }

    if (!this.opts.isReady()) {
      this.writeJson(res, 503, {
        id: "",
        error:
          "Lightroom plugin not connected. Open Lightroom and click 'Start Server' in Plug-in Manager.",
      });
      return;
    }

    try {
      const response = await this.enqueue(parsed.action, parsed.params ?? {});
      this.writeJson(res, 200, response);
    } catch (err) {
      this.writeJson(res, 500, {
        id: "",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private enqueue(action: string, params: unknown): Promise<PluginResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ action, params, resolve, reject });
      void this.drainQueue();
    });
  }

  private async drainQueue(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) continue;
        try {
          item.resolve(await this.opts.dispatcher.call(item.action, item.params));
        } catch (err) {
          item.reject(err instanceof Error ? err : new Error(String(err)));
        }
      }
    } finally {
      this.running = false;
    }
  }

  private writeJson(res: http.ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
  }
}

function readBody(req: http.IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error(`Request body too large; max ${maxBytes} bytes`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isCallRequest(value: unknown): value is { action: string; params?: unknown } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.action === "string";
}
