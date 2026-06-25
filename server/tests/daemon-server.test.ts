import { describe, it, expect, afterEach } from '@jest/globals';
import { DaemonClient } from '../src/daemon-client.js';
import { LightroomDaemonServer } from '../src/daemon-server.js';

let server: LightroomDaemonServer | null = null;

describe('LightroomDaemonServer', () => {
  afterEach(async () => {
    if (!server) return;
    await server.stop();
    server = null;
  });

  it('reports status', async () => {
    server = new LightroomDaemonServer({
      host: '127.0.0.1',
      port: 0,
      dispatcher: {
        call: async () => ({ id: 'x', result: null }),
        pendingCount: () => 2,
      },
      isReady: () => true,
      requestPort: 58763,
      responsePort: 58764,
      log: () => {},
    });
    await server.start();
    const port = server.address()!.port;
    const client = new DaemonClient({ host: '127.0.0.1', port });
    await expect(client.status()).resolves.toMatchObject({
      ok: true,
      ready: true,
      pending: 2,
      requestPort: 58763,
      responsePort: 58764,
    });
  });

  it('queues calls serially', async () => {
    const calls: string[] = [];
    let firstRelease: (() => void) | null = null;
    const firstGate = new Promise<void>((resolve) => {
      firstRelease = resolve;
    });

    server = new LightroomDaemonServer({
      host: '127.0.0.1',
      port: 0,
      dispatcher: {
        call: async (action) => {
          calls.push(action);
          if (action === 'first') await firstGate;
          return { id: action, result: { action } };
        },
        pendingCount: () => 0,
      },
      isReady: () => true,
      requestPort: 58763,
      responsePort: 58764,
      log: () => {},
    });
    await server.start();
    const port = server.address()!.port;
    const client = new DaemonClient({ host: '127.0.0.1', port });

    const first = client.call('first', {});
    await waitFor(() => calls.length === 1);
    const second = client.call('second', {});
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls).toEqual(['first']);
    firstRelease!();

    await expect(first).resolves.toEqual({ id: 'first', result: { action: 'first' } });
    await expect(second).resolves.toEqual({ id: 'second', result: { action: 'second' } });
    expect(calls).toEqual(['first', 'second']);
  });

  it('returns a plugin-style error when Lightroom is not ready', async () => {
    server = new LightroomDaemonServer({
      host: '127.0.0.1',
      port: 0,
      dispatcher: {
        call: async () => ({ id: 'x', result: null }),
        pendingCount: () => 0,
      },
      isReady: () => false,
      requestPort: 58763,
      responsePort: 58764,
      log: () => {},
    });
    await server.start();
    const port = server.address()!.port;
    const client = new DaemonClient({ host: '127.0.0.1', port });

    await expect(client.call('search_photos', {})).resolves.toMatchObject({
      id: '',
      error: expect.stringMatching(/not connected/i),
    });
  });
});

function waitFor(check: () => boolean, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (check()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('waitFor timeout'));
      setTimeout(tick, 10);
    };
    tick();
  });
}
