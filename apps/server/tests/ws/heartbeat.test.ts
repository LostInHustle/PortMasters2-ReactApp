import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { startHeartbeat } from '../../src/ws/heartbeat.js';

// Drives startHeartbeat against a real WebSocketServer + real client sockets on an ephemeral
// port (no mocking of the network layer), the same approach as integration/fullFlow.test.ts.
describe('startHeartbeat', () => {
  let wss: WebSocketServer;
  let port: number;
  let stop: () => void;

  beforeEach(async () => {
    wss = new WebSocketServer({ port: 0 });
    await new Promise<void>((resolve) => wss.once('listening', resolve));
    port = (wss.address() as AddressInfo).port;
  });

  afterEach(async () => {
    stop?.();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
  });

  it('pings every connected client on each interval', async () => {
    stop = startHeartbeat(wss, 20);
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve) => client.once('open', () => resolve()));

    let pingCount = 0;
    client.on('ping', () => pingCount++);

    await vi.waitFor(() => expect(pingCount).toBeGreaterThanOrEqual(2), { timeout: 2000 });
    client.close();
  });

  it('keeps a normally-responsive client alive (ws auto-pongs by default)', async () => {
    stop = startHeartbeat(wss, 20);
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve) => client.once('open', () => resolve()));

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });

  it('terminates a client that stops responding to pings (network gone, no clean close)', async () => {
    stop = startHeartbeat(wss, 20, 2);
    // autoPong: false simulates a connection whose other end can no longer respond -- the
    // exact "laptop asleep / wifi dropped" case this heartbeat is meant to detect.
    const client = new WebSocket(`ws://127.0.0.1:${port}`, { autoPong: false });
    await new Promise<void>((resolve) => client.once('open', () => resolve()));

    await vi.waitFor(
      () => {
        if (client.readyState !== WebSocket.CLOSED) throw new Error('not closed yet');
      },
      { timeout: 2000, interval: 10 },
    );
  });

  it('does not terminate before reaching the missed-ping threshold', async () => {
    // Regression test: the original version of this heartbeat terminated on the very first
    // missed pong, which made a backgrounded tab or a moment of network jitter indistinguishable
    // from a dead connection. With maxMissedPings=3, two missed ticks (40ms at this interval)
    // must NOT be enough to terminate -- the old single-miss heartbeat would have already killed
    // this connection by now.
    stop = startHeartbeat(wss, 20, 3);
    const client = new WebSocket(`ws://127.0.0.1:${port}`, { autoPong: false });
    await new Promise<void>((resolve) => client.once('open', () => resolve()));

    await new Promise((resolve) => setTimeout(resolve, 45));
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.terminate();
  });

  it('stops pinging once the returned stop function is called', async () => {
    stop = startHeartbeat(wss, 20);
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve) => client.once('open', () => resolve()));
    stop();

    let pingCount = 0;
    client.on('ping', () => pingCount++);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(pingCount).toBe(0);
    client.close();
  });
});
