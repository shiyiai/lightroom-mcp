# Lightroom MCP Init Guide

## Goal

Initialize a Codex workspace so it can use Lightroom Classic through the local Lightroom MCP bridge.

## One Command

From a local checkout, run this inside the project folder where you want Codex to use Lightroom:

```bash
node /path/to/lightroom-mcp/server/dist/index.js init
```

After the package is published to npm:

```bash
npx -y @shiyiai/lightroom-mcp init
```

## What Init Does

`lightroom-mcp init` performs these actions:

1. Installs or confirms the bundled `LightroomMCP.lrplugin`.
2. Creates `.codex/config.toml` in the current folder.
3. Adds a project-scoped `lightroom` MCP server.
4. Enables the MCP server for that workspace.
5. Leaves daemon startup automatic; no separate daemon terminal is required.

Generated Codex config looks like:

```toml
[mcp_servers.lightroom]
command = "node"
args = ["/absolute/path/to/server/dist/index.js"]
startup_timeout_sec = 10
tool_timeout_sec = 300
enabled = true
default_tools_approval_mode = "prompt"
```

## Lightroom Setup

After init:

1. Fully quit and reopen Lightroom Classic.
2. Open `File -> Plug-in Manager`.
3. Select `Lightroom MCP`.
4. Click `Start Server`.

The plugin listens on:

- request: `127.0.0.1:58763`
- response: `127.0.0.1:58764`

The Node daemon auto-starts on:

- daemon API: `127.0.0.1:58765`

## Start Codex

From the initialized workspace:

```bash
codex
```

If your Codex config keeps project MCP servers disabled by default, start with:

```bash
codex -c mcp_servers.lightroom.enabled=true
```

## Verify

Use the CLI:

```bash
lightroom-mcp status
lightroom-mcp selected --limit 10
```

Or from a local checkout:

```bash
node /path/to/lightroom-mcp/server/dist/index.js status
node /path/to/lightroom-mcp/server/dist/index.js selected --limit 10
```

## Skill Install

This repo includes a Codex skill:

```text
skills/lightroom-mcp
```

Install it:

```bash
mkdir -p ~/.codex/skills
cp -R skills/lightroom-mcp ~/.codex/skills/
```

Use it:

```text
Use $lightroom-mcp to inspect the selected Lightroom photos and make conservative edits.
```

## Troubleshooting

- If MCP tools say the plugin is not connected, click `Start Server` in Lightroom Plug-in Manager.
- If the daemon fails to auto-start, inspect `~/Library/Logs/lightroom-mcp/daemon.log`.
- If Codex does not show the tool, restart Codex from the initialized workspace.
