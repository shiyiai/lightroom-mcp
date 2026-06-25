---
name: lightroom-mcp
description: Control Adobe Lightroom Classic through the local Lightroom MCP bridge. Use when Codex needs to inspect selected photos or catalog search results, read metadata or Develop settings, apply conservative photo edits such as brighter exposure, whiter background, clearer product detail, yellow color-cast correction, softer shadows, overexposure protection, sync settings to selected photos, create snapshots, or undo Lightroom/MCP edits.
---

# Lightroom MCP

## Operating Model

Use the `lightroom` MCP tools when they are available. If the MCP server is not mounted in the current Codex session, use the CLI:

```bash
lightroom-mcp status
lightroom-mcp selected --limit 10
lightroom-mcp call search_photos '{"limit":10}'
```

The MCP/CLI auto-starts one local daemon on `127.0.0.1:58765`. The daemon owns the Lightroom plugin sockets `58763` and `58764`, so multiple Codex sessions can coexist.

## Safety Rules

- Treat every Develop edit as a real Lightroom catalog change.
- Before editing, inspect the target set with `get_selected_photos` or `search_photos`.
- Before significant Develop edits, create a snapshot with `create_develop_snapshot`.
- Prefer small relative edits through `adjust_develop_settings` before direct raw writes.
- After editing, read back `get_develop_settings_raw` or re-check selected photos when useful.
- Use `undo_last_mcp_develop_edit` for MCP-captured Develop edits; use `lightroom_undo` carefully because it may undo user actions too.

## Common Workflow

1. Confirm Lightroom is connected:

```bash
lightroom-mcp status
```

2. Inspect selection:

```text
get_selected_photos { "limit": 20 }
```

3. Snapshot before broad Develop edits:

```text
create_develop_snapshot { "photo_ids": ["<id>"], "name": "Before MCP edit" }
```

4. Apply conservative adjustments:

```text
adjust_develop_settings {
  "photo_ids": ["<id>"],
  "adjustments": { "Exposure2012": 0.2 }
}
```

5. Sync settings to selected photos when requested:

```text
apply_develop_settings_to_selected { "source_id": "<id>" }
```

## Natural Language Mapping

- "亮一点": small positive `Exposure2012`; optionally raise `Shadows2012`.
- "背景白一点": small positive `Whites2012`, `Highlights2012`, or `Exposure2012`; avoid clipping.
- "产品更清晰": raise `Texture`, `Clarity2012`, or `Sharpness` conservatively.
- "偏黄修正": lower `Temperature`; adjust `Tint` only if needed.
- "阴影柔和一点": raise `Shadows2012` or reduce `Contrast2012`.
- "不要过曝": lower `Highlights2012`, `Whites2012`, or `Exposure2012`.
- "把这个设置应用到选中的其他图片": use `apply_develop_settings_to_selected`.
- "撤销上一步": prefer `undo_last_mcp_develop_edit`; use `lightroom_undo` only when the user clearly wants global undo.

## Useful Tools

- Read/search: `get_selected_photos`, `search_photos`, `get_photo_metadata`, `get_develop_settings_raw`, `list_develop_setting_keys`.
- Develop edits: `adjust_develop_settings`, `set_develop_settings`, `set_develop_settings_raw`, `quick_develop`, `develop_controller_call`.
- Presets/sync: `list_develop_presets`, `apply_develop_preset`, `copy_develop_settings`, `apply_develop_settings_to_selected`.
- Safety/undo: `create_develop_snapshot`, `undo_last_mcp_develop_edit`, `lightroom_undo_status`, `lightroom_undo`, `lightroom_redo`.
