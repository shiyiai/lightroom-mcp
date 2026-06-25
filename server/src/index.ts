#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tokenFilePath } from "./token.js";
import { createMcpServer } from "./create-server.js";
import { parseCli, helpText } from "./cli.js";
import { VERSION } from "./version.js";
import { createDirectLightroomBridge } from "./lightroom-bridge.js";
import { DaemonClient } from "./daemon-client.js";
import { LightroomDaemonServer } from "./daemon-server.js";
import { ensureDaemonRunning } from "./daemon-autostart.js";
import { daemonHost, daemonPort } from "./runtime-config.js";
import { initCodexWorkspace, mcpCommandForEntrypoint } from "./init-workspace.js";
import {
  ensurePluginInstalled,
  findBundledPlugin,
  installPlugin,
  lightroomModulesDir,
} from "./install-plugin.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  let cli;
  try {
    cli = parseCli(process.argv);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(2);
  }

  if (cli.command === "help") {
    process.stdout.write(helpText());
    return;
  }
  if (cli.command === "version") {
    process.stdout.write(VERSION + "\n");
    return;
  }
  if (cli.command === "install-plugin") {
    runInstallPlugin();
    return;
  }
  if (cli.command === "init") {
    runInit();
    return;
  }

  if (cli.command === "daemon") {
    await runDaemon();
    return;
  }
  if (cli.command === "direct-stdio") {
    await runDirectStdio();
    return;
  }
  if (cli.command === "stdio") {
    await runStdio();
    return;
  }

  await runCliCommand(cli.command, cli.args);
}

async function runDaemon(): Promise<void> {
  ensurePluginInstalled(here, (m) => console.error(m));

  const bridge = createDirectLightroomBridge();
  const server = new LightroomDaemonServer({
    host: daemonHost(),
    port: daemonPort(),
    dispatcher: bridge.dispatcher,
    isReady: bridge.isReady,
    requestPort: bridge.ports.request,
    responsePort: bridge.ports.response,
  });

  process.on("SIGINT", () => {
    void server.stop().finally(() => {
      bridge.stop();
      process.exit(0);
    });
  });
  process.on("SIGTERM", () => {
    void server.stop().finally(() => {
      bridge.stop();
      process.exit(0);
    });
  });

  await server.start();
  console.error(`Connecting to plugin: request :${bridge.ports.request}, response :${bridge.ports.response}`);
  console.error(`Token file: ${tokenFilePath()}`);
}

async function runDirectStdio(): Promise<void> {
  ensurePluginInstalled(here, (m) => console.error(m));

  const bridge = createDirectLightroomBridge();
  const server = createMcpServer({
    dispatcher: bridge.dispatcher,
    isReady: bridge.isReady,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Lightroom MCP server v${VERSION} running on stdio (direct plugin mode)`);
  console.error(`Connecting to plugin: request :${bridge.ports.request}, response :${bridge.ports.response}`);
  console.error(`Token file: ${tokenFilePath()}`);
}

async function runStdio(): Promise<void> {
  await ensureDaemonRunning({
    host: daemonHost(),
    port: daemonPort(),
    log: (msg) => console.error(msg),
  });
  const client = new DaemonClient({ host: daemonHost(), port: daemonPort(), timeoutMs: 300_000 });
  await runDaemonBackedStdio(client);
}

async function runDaemonBackedStdio(client: DaemonClient): Promise<void> {
  const server = createMcpServer({
    dispatcher: { call: (action, params) => client.call(action, params) },
    isReady: () => true,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Lightroom MCP server v${VERSION} running on stdio`);
  console.error(`Using Lightroom daemon: http://${daemonHost()}:${daemonPort()}`);
}

async function runCliCommand(command: string, args: string[]): Promise<void> {
  await ensureDaemonRunning({
    host: daemonHost(),
    port: daemonPort(),
    log: (msg) => console.error(msg),
  });
  const client = new DaemonClient({ host: daemonHost(), port: daemonPort(), timeoutMs: 300_000 });
  let action: string;
  let params: unknown;

  switch (command) {
    case "status": {
      process.stdout.write(JSON.stringify(await client.status(), null, 2) + "\n");
      return;
    }
    case "call": {
      action = requireArg(args, 0, "tool name");
      params = args[1] ? parseJsonArg(args[1]) : {};
      break;
    }
    case "selected": {
      action = "get_selected_photos";
      params = parseLimitOffset(args);
      break;
    }
    case "search": {
      action = "search_photos";
      params = parseLimitOffset(args);
      break;
    }
    case "raw-settings": {
      action = "get_develop_settings_raw";
      params = { photo_id: requireArg(args, 0, "photo id") };
      break;
    }
    case "adjust": {
      const photoId = requireArg(args, 0, "photo id");
      const key = requireArg(args, 1, "develop setting key");
      const delta = Number(requireArg(args, 2, "numeric delta"));
      if (!Number.isFinite(delta)) throw new Error(`delta must be a number, got "${args[2]}"`);
      action = "adjust_develop_settings";
      params = { photo_ids: [photoId], adjustments: { [key]: delta } };
      break;
    }
    case "snapshot": {
      action = "create_develop_snapshot";
      params = {
        photo_ids: [requireArg(args, 0, "photo id")],
        name: requireArg(args, 1, "snapshot name"),
      };
      break;
    }
    case "undo": {
      action = "lightroom_undo";
      params = {};
      break;
    }
    case "redo": {
      action = "lightroom_redo";
      params = {};
      break;
    }
    default:
      throw new Error(`Unsupported command: ${command}`);
  }

  const result = await client.call(action, params);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

function runInit(): void {
  runInstallPlugin({ exitOnComplete: false });
  const command = mcpCommandForEntrypoint(path.join(here, "index.js"));
  const result = initCodexWorkspace({
    cwd: process.cwd(),
    command: command.command,
    args: command.args,
    enabled: true,
  });
  console.error(`Codex MCP config ${result.status}: ${result.configPath}`);
  console.error("Next steps:");
  console.error("1. Fully quit and reopen Lightroom Classic.");
  console.error("2. File -> Plug-in Manager -> Lightroom MCP -> Start Server.");
  console.error("3. Start Codex from this folder.");
}

function runInstallPlugin(opts: { exitOnComplete?: boolean } = {}): void {
  const source = findBundledPlugin(here);
  if (!source) {
    console.error("Could not locate bundled LightroomMCP.lrplugin folder near this binary.");
    console.error("If you cloned the repo, run from the repo root or pass a path explicitly.");
    process.exit(1);
  }
  const dest = lightroomModulesDir();
  try {
    const result = installPlugin({ source, destDir: dest });
    if (result.status === "installed") {
      console.error(`Installed plugin: ${result.destination}`);
      console.error(`Restart Lightroom Classic to load it.`);
    } else if (result.status === "already-present") {
      console.error(`Plugin already present at ${result.destination}`);
    } else {
      console.error(`Skipped: ${result.reason ?? "unknown reason"}`);
      if (opts.exitOnComplete !== false) process.exit(1);
    }
  } catch (err) {
    console.error(`Install failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

function requireArg(args: string[], index: number, label: string): string {
  const value = args[index];
  if (!value) throw new Error(`Missing ${label}`);
  return value;
}

function parseJsonArg(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON argument (${msg})`);
  }
}

function parseLimitOffset(args: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < args.length; i++) {
    const name = args[i];
    if (name !== "--limit" && name !== "--offset") {
      throw new Error(`Unknown option: ${name}`);
    }
    const raw = args[++i];
    if (!raw) throw new Error(`Missing value for ${name}`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a non-negative number`);
    }
    out[name.slice(2)] = value;
  }
  return out;
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
