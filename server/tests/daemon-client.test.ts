import { describe, it, expect, afterEach } from '@jest/globals';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { DaemonClient } from '../src/daemon-client.js';

let server: http.Server | null = null;

function listen(handler: http.RequestListener): Promise<number> {
  server = http.createServer(handler);
  return new Promise((resolve) => {
    server!.listen(0, '127.0.0.1', () => {
      resolve((server!.address() as AddressInfo).port);
    });
  });
}

describe('DaemonClient', () => {
  afterEach(async () => {
    if (!server) return;
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  });

  it('reads daemon status', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        ready: true,
        pending: 0,
        queue: 0,
        requestPort: 58763,
        responsePort: 58764,
      }));
    });

    const client = new DaemonClient({ host: '127.0.0.1', port });
    await expect(client.status()).resolves.toMatchObject({ ok: true, ready: true });
  });

  it('posts tool calls', async () => {
    let body = '';
    const port = await listen((req, res) => {
      req.setEncoding('utf8');
      req.on('data', (chunk: string) => {
        body += chunk;
      });
      req.on('end', () => {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: '1', result: { ok: true } }));
      });
    });

    const client = new DaemonClient({ host: '127.0.0.1', port });
    await expect(client.call('search_photos', { limit: 1 })).resolves.toEqual({
      id: '1',
      result: { ok: true },
    });
    expect(JSON.parse(body)).toEqual({ action: 'search_photos', params: { limit: 1 } });
  });

  it('returns plugin response envelopes from failed /call responses', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: '', error: 'Lightroom plugin not connected' }));
    });

    const client = new DaemonClient({ host: '127.0.0.1', port });
    await expect(client.call('search_photos', {})).resolves.toEqual({
      id: '',
      error: 'Lightroom plugin not connected',
    });
  });

  it('reports a clear error when daemon is not running', async () => {
    const client = new DaemonClient({ host: '127.0.0.1', port: 9, timeoutMs: 500 });
    await expect(client.status()).rejects.toThrow(/lightroom-mcp daemon/i);
  });
});
