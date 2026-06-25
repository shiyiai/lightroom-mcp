# @shiyiai/lightroom-mcp

MCP server bridging Claude / Codex / Cursor to Adobe Lightroom Classic via a bundled Lua plugin.

## Quick install

### Claude Desktop / Claude Code (one-click)

Grab the `.mcpb` from [GitHub Releases](https://github.com/shiyiai/lightroom-mcp/releases/latest) and double-click. The Lightroom plugin auto-installs on first run.

### Codex CLI

From a local checkout:

```bash
npm ci
npm run build
codex mcp add lightroom -- node /absolute/path/to/lightroom-mcp/server/dist/index.js
```

Or initialize the current Codex workspace:

```bash
node /absolute/path/to/lightroom-mcp/server/dist/index.js init
```

After npm publication, the package can also be used as `npx -y @shiyiai/lightroom-mcp`.

### Cursor / Windsurf / VS Code

Add to MCP config:

```json
{
  "mcpServers": {
    "lightroom": {
      "command": "node",
      "args": ["/absolute/path/to/lightroom-mcp/server/dist/index.js"]
    }
  }
}
```

## Commands

```
lightroom-mcp [stdio]            Run MCP over stdio; auto-start/reuse daemon
lightroom-mcp init               Install plugin and write .codex/config.toml
lightroom-mcp install-plugin     Copy plugin into Lightroom Modules folder
```

## Docs and source

Full documentation, architecture notes, and the Lightroom plugin live at
<https://github.com/shiyiai/lightroom-mcp>.

## License

MIT
