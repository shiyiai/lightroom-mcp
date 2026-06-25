export interface ParsedCli {
  command:
    | "stdio"
    | "direct-stdio"
    | "daemon"
    | "status"
    | "call"
    | "selected"
    | "search"
    | "raw-settings"
    | "adjust"
    | "snapshot"
    | "undo"
    | "redo"
    | "init"
    | "install-plugin"
    | "help"
    | "version";
  args: string[];
}

const HELP = `lightroom-mcp — MCP bridge to Adobe Lightroom Classic

USAGE
  lightroom-mcp [stdio]                 Run MCP over stdio; auto-starts/reuses daemon
  lightroom-mcp daemon                  Run the daemon in the foreground for debugging
  lightroom-mcp direct-stdio            Run MCP over stdio and connect directly to Lightroom plugin
  lightroom-mcp status                  Auto-start daemon and show plugin connection status
  lightroom-mcp call <tool> [json]      Auto-start daemon and call any Lightroom MCP tool
  lightroom-mcp selected [--limit N]    List selected/filmstrip photos
  lightroom-mcp search [--limit N]      Search/list catalog photos
  lightroom-mcp raw-settings <photo>    Read raw develop settings for a photo
  lightroom-mcp adjust <photo> <key> <delta>
  lightroom-mcp snapshot <photo> <name>
  lightroom-mcp undo | redo
  lightroom-mcp init                    Install plugin and write .codex/config.toml in cwd
  lightroom-mcp install-plugin          Install bundled .lrplugin into Lightroom Modules folder
  lightroom-mcp --help | --version

ENV
  LIGHTROOM_MCP_REQUEST_PORT   plugin request port  (default 58763)
  LIGHTROOM_MCP_RESPONSE_PORT  plugin response port (default 58764)
  LIGHTROOM_MCP_DAEMON_HOST    daemon host          (default 127.0.0.1)
  LIGHTROOM_MCP_DAEMON_PORT    daemon port          (default 58765)
  LIGHTROOM_MCP_LOG_DIR        daemon log directory
  LIGHTROOM_MCP_TOKEN_PATH     auth token file      (default ~/.config/lightroom-mcp/token)
`;

export function parseCli(argv: string[]): ParsedCli {
  const args = argv.slice(2);
  if (args.length === 0) return { command: "stdio", args: [] };

  const first = args[0];
  if (first === "--help" || first === "-h") return { command: "help", args: [] };
  if (first === "--version" || first === "-v") return { command: "version", args: [] };

  if (first === "stdio") return { command: "stdio", args: args.slice(1) };
  if (first === "direct-stdio") return { command: "direct-stdio", args: args.slice(1) };
  if (first === "daemon") return { command: "daemon", args: args.slice(1) };
  if (first === "status") return { command: "status", args: args.slice(1) };
  if (first === "call") return { command: "call", args: args.slice(1) };
  if (first === "selected") return { command: "selected", args: args.slice(1) };
  if (first === "search") return { command: "search", args: args.slice(1) };
  if (first === "raw-settings") return { command: "raw-settings", args: args.slice(1) };
  if (first === "adjust") return { command: "adjust", args: args.slice(1) };
  if (first === "snapshot") return { command: "snapshot", args: args.slice(1) };
  if (first === "undo") return { command: "undo", args: args.slice(1) };
  if (first === "redo") return { command: "redo", args: args.slice(1) };
  if (first === "init") return { command: "init", args: args.slice(1) };
  if (first === "install-plugin") return { command: "install-plugin", args: args.slice(1) };

  throw new Error(`Unknown command: ${first}\n\n${HELP}`);
}

export function helpText(): string {
  return HELP;
}
