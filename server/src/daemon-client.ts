import type { PluginResponse } from "./dispatcher.js";

export interface DaemonClientOptions {
  host: string;
  port: number;
  timeoutMs?: number;
}

export interface DaemonStatus {
  ok: boolean;
  ready: boolean;
  pending: number;
  queue: number;
  requestPort: number;
  responsePort: number;
}

export class DaemonClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: DaemonClientOptions) {
    this.baseUrl = `http://${opts.host}:${opts.port}`;
    this.timeoutMs = opts.timeoutMs ?? 5_000;
  }

  async status(): Promise<DaemonStatus> {
    return this.requestJson<DaemonStatus>("/status", {
      method: "GET",
    });
  }

  async call(action: string, params: unknown): Promise<PluginResponse> {
    return this.requestJson<PluginResponse>("/call", {
      method: "POST",
      body: JSON.stringify({ action, params: params ?? {} }),
      headers: { "content-type": "application/json" },
    });
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.baseUrl + path, {
        ...init,
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok) {
        if (path === "/call") {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Fall through to a plain HTTP error if the daemon did not return
            // the normal plugin response envelope.
          }
        }
        throw new Error(text || `Daemon request failed with HTTP ${response.status}`);
      }
      return parseJson<T>(text);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Lightroom daemon request timeout (${this.timeoutMs / 1000}s)`);
      }
      if (isConnectionFailure(err)) {
        throw new Error(
          `Lightroom daemon is not running at ${this.baseUrl}. Start it with: lightroom-mcp daemon`,
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Bad JSON from Lightroom daemon (${msg}): ${text}`);
  }
}

function isConnectionFailure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: unknown }).message;
  if (message === "fetch failed") return true;
  const cause = (err as { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") return false;
  const code = (cause as { code?: unknown }).code;
  return code === "ECONNREFUSED" || code === "ECONNRESET";
}
