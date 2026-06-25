import fs from "node:fs";
import path from "node:path";

export interface InitWorkspaceOptions {
  cwd: string;
  command: string;
  args: string[];
  enabled?: boolean;
}

export interface InitWorkspaceResult {
  configPath: string;
  status: "created" | "updated" | "unchanged";
}

export function initCodexWorkspace(opts: InitWorkspaceOptions): InitWorkspaceResult {
  const codexDir = path.join(opts.cwd, ".codex");
  const configPath = path.join(codexDir, "config.toml");
  const stanza = codexLightroomStanza({
    command: opts.command,
    args: opts.args,
    enabled: opts.enabled ?? true,
  });

  fs.mkdirSync(codexDir, { recursive: true });
  const before = readFileIfExists(configPath);
  const after = upsertLightroomStanza(before, stanza);
  if (before === after) return { configPath, status: "unchanged" };
  fs.writeFileSync(configPath, after);
  return { configPath, status: before ? "updated" : "created" };
}

export function codexLightroomStanza(opts: {
  command: string;
  args: string[];
  enabled: boolean;
}): string {
  return [
    "[mcp_servers.lightroom]",
    `command = ${tomlString(opts.command)}`,
    `args = [${opts.args.map(tomlString).join(", ")}]`,
    "startup_timeout_sec = 10",
    "tool_timeout_sec = 300",
    `enabled = ${opts.enabled ? "true" : "false"}`,
    'default_tools_approval_mode = "prompt"',
    "",
  ].join("\n");
}

export function upsertLightroomStanza(current: string, stanza: string): string {
  const normalized = current.trimEnd();
  const block = stanza.trimEnd();
  if (!normalized) return block + "\n";

  const pattern = /(?:^|\n)\[mcp_servers\.lightroom\]\n[\s\S]*?(?=\n\[|$)/;
  if (pattern.test(normalized)) {
    return normalized.replace(pattern, (match) => {
      const prefix = match.startsWith("\n") ? "\n" : "";
      return prefix + block;
    }) + "\n";
  }
  return normalized + "\n\n" + block + "\n";
}

export function mcpCommandForEntrypoint(entrypoint: string): { command: string; args: string[] } {
  const base = path.basename(process.execPath).toLowerCase();
  if (base === "node" || base === "node.exe") {
    return { command: process.execPath, args: [entrypoint] };
  }
  return { command: process.execPath, args: [] };
}

function readFileIfExists(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}
