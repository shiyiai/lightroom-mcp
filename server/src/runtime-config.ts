export const REQUEST_TIMEOUT_MS = 30_000;
export const LONG_RUNNING_TIMEOUT_MS = 300_000;

export const ACTION_TIMEOUTS_MS: Record<string, number> = {
  export_photos: LONG_RUNNING_TIMEOUT_MS,
  import_photos: LONG_RUNNING_TIMEOUT_MS,
};

const DEFAULT_DAEMON_PORT = 58765;

function parsePort(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new Error(`${name} must be a positive integer 1-65535, got "${raw}"`);
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`${name} must be a positive integer 1-65535, got "${raw}"`);
  }
  return n;
}

export function daemonPort(): number {
  return parsePort(
    process.env.LIGHTROOM_MCP_DAEMON_PORT,
    DEFAULT_DAEMON_PORT,
    "LIGHTROOM_MCP_DAEMON_PORT",
  );
}

export function daemonHost(): string {
  return process.env.LIGHTROOM_MCP_DAEMON_HOST?.trim() || "127.0.0.1";
}
