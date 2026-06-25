import { describe, it, expect } from '@jest/globals';
import { parseCli } from '../src/cli.js';

describe('parseCli', () => {
  function p(...args: string[]) {
    return parseCli(['node', 'index.js', ...args]);
  }

  it('defaults to stdio with no args', () => {
    expect(p().command).toBe('stdio');
    expect(p().args).toEqual([]);
  });

  it('parses explicit stdio', () => {
    expect(p('stdio').command).toBe('stdio');
  });

  it('parses daemon and direct stdio commands', () => {
    expect(p('daemon').command).toBe('daemon');
    expect(p('direct-stdio').command).toBe('direct-stdio');
  });

  it('parses CLI operation commands with remaining args', () => {
    expect(p('status')).toEqual({ command: 'status', args: [] });
    expect(p('call', 'search_photos', '{"limit":1}')).toEqual({
      command: 'call',
      args: ['search_photos', '{"limit":1}'],
    });
    expect(p('selected', '--limit', '5')).toEqual({
      command: 'selected',
      args: ['--limit', '5'],
    });
    expect(p('search')).toEqual({ command: 'search', args: [] });
    expect(p('raw-settings', '123')).toEqual({ command: 'raw-settings', args: ['123'] });
    expect(p('adjust', '123', 'Exposure2012', '0.2')).toEqual({
      command: 'adjust',
      args: ['123', 'Exposure2012', '0.2'],
    });
    expect(p('snapshot', '123', 'Before')).toEqual({ command: 'snapshot', args: ['123', 'Before'] });
    expect(p('undo')).toEqual({ command: 'undo', args: [] });
    expect(p('redo')).toEqual({ command: 'redo', args: [] });
    expect(p('init')).toEqual({ command: 'init', args: [] });
  });

  it('parses install-plugin command', () => {
    expect(p('install-plugin').command).toBe('install-plugin');
  });

  it('parses help', () => {
    expect(p('--help').command).toBe('help');
    expect(p('-h').command).toBe('help');
  });

  it('parses version', () => {
    expect(p('--version').command).toBe('version');
    expect(p('-v').command).toBe('version');
  });

  it('throws on unknown command', () => {
    expect(() => p('frobnicate')).toThrow(/Unknown command/);
  });
});
