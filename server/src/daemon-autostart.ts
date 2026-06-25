import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DaemonClient } from "./daemon-client.js";

export interface EnsureDaemonOptions {
  host: string;
  port: number;
  timeoutMs?: number;
  pollMs?: number;
  log?: (msg: string) => void;
}

export function daemonLogPath(): string {
  const base =
    process.env.LIGHTROOM_MCP_LOG_DIR ??
    (process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Logs", "lightroom-mcp")
      : path.join(os.homedir(), ".local", "state", "lightroom-mcp"));
  return path.join(base, "daemon.log");
}

export async function ensureDaemonRunning(opts: EnsureDaemonOptions): Promise<DaemonClient> {
  const timeoutMs = opts.timeoutMs ?? 8_000;
  const pollMs = opts.pollMs ?? 200;
  const log = opts.log ?? (() => {});
  const client = new DaemonClient({ host: opts.host, port: opts.port, timeoutMs: 500 });

  if (await isDaemonReachable(client)) return client;

  startDetachedDaemon(log);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isDaemonReachable(client)) return client;
    await sleep(pollMs);
  }

  throw new Error(
    `Lightroom daemon did not start within ${timeoutMs / 1000}s. Log: ${daemonLogPath()}`,
  );
}

async function isDaemonReachable(client: DaemonClient): Promise<boolean> {
  try {
    await client.status();
    return true;
  } catch {
    return false;
  }
}

function startDetachedDaemon(log: (msg: string) => void): void {
  const logFile = daemonLogPath();
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const out = fs.openSync(logFile, "a");
  const err = fs.openSync(logFile, "a");
  const spawnSpec = daemonSpawnSpec();
  const child = spawn(spawnSpec.command, spawnSpec.args, {
    detached: true,
    stdio: ["ignore", out, err],
    env: process.env,
  });
  fs.closeSync(out);
  fs.closeSync(err);
  child.unref();
  log(`Started Lightroom daemon pid=${child.pid}; log=${logFile}`);
}

function daemonSpawnSpec(): { command: string; args: string[] } {
  if (isNodeRuntime()) {
    return {
      command: process.execPath,
      args: [currentEntrypoint(), "daemon"],
    };
  }
  return {
    command: process.execPath,
    args: ["daemon"],
  };
}

function isNodeRuntime(): boolean {
  const base = path.basename(process.execPath).toLowerCase();
  return base === "node" || base === "node.exe";
}

function currentEntrypoint(): string {
  const current = fileURLToPath(import.meta.url);
  return current.replace(/daemon-autostart\.js$/, "index.js");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
