import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  codexLightroomStanza,
  initCodexWorkspace,
  upsertLightroomStanza,
} from '../src/init-workspace.js';

describe('codexLightroomStanza', () => {
  it('renders the project-scoped Lightroom MCP config', () => {
    expect(codexLightroomStanza({
      command: '/usr/local/bin/node',
      args: ['/repo/server/dist/index.js'],
      enabled: true,
    })).toContain('[mcp_servers.lightroom]\ncommand = "/usr/local/bin/node"');
  });
});

describe('upsertLightroomStanza', () => {
  const stanza = codexLightroomStanza({
    command: 'node',
    args: ['/new/index.js'],
    enabled: true,
  });

  it('creates a config from empty content', () => {
    expect(upsertLightroomStanza('', stanza)).toBe(stanza.trimEnd() + '\n');
  });

  it('appends when no Lightroom stanza exists', () => {
    const result = upsertLightroomStanza('[sandbox]\nmode = "workspace-write"\n', stanza);
    expect(result).toContain('[sandbox]\nmode = "workspace-write"\n\n[mcp_servers.lightroom]');
  });

  it('replaces an existing Lightroom stanza without deleting following sections', () => {
    const current = [
      '[mcp_servers.lightroom]',
      'command = "old"',
      'args = []',
      '',
      '[other]',
      'x = 1',
      '',
    ].join('\n');
    const result = upsertLightroomStanza(current, stanza);
    expect(result).toContain('command = "node"');
    expect(result).not.toContain('command = "old"');
    expect(result).toContain('\n[other]\nx = 1');
  });
});

describe('initCodexWorkspace', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lrmcp-init-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writes .codex/config.toml in the target workspace', () => {
    const result = initCodexWorkspace({
      cwd: tmp,
      command: 'node',
      args: ['/repo/server/dist/index.js'],
    });
    expect(result.status).toBe('created');
    expect(result.configPath).toBe(path.join(tmp, '.codex', 'config.toml'));
    expect(fs.readFileSync(result.configPath, 'utf8')).toContain('[mcp_servers.lightroom]');
  });
});
