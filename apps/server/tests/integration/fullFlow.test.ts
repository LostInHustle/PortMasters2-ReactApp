import { mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { UserStore } from '../../src/auth/UserStore.js';
import { createAppServer } from '../../src/http/createHttpServer.js';
import { createServerState } from '../../src/lobby/onlineRegistry.js';

// Phase 4 exit criterion (plan.md): "a real WS client can register/login/list/invite/accept and
// receive state pushes" -- driven here against a real http+ws server on an ephemeral port, with
// no mocking of the network layer.
interface Msg {
  type: string;
  [key: string]: unknown;
}

class TestClient {
  private readonly log: Msg[] = [];
  readonly ws: WebSocket;

  private constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on('message', (data) => this.log.push(JSON.parse(data.toString())));
  }

  static connect(port: number): Promise<TestClient> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      ws.once('open', () => resolve(new TestClient(ws)));
      ws.once('error', reject);
    });
  }

  send(obj: unknown): void {
    this.ws.send(JSON.stringify(obj));
  }

  async waitFor(predicate: (m: Msg) => boolean): Promise<Msg> {
    return vi.waitFor(
      () => {
        const found = this.log.find(predicate);
        if (!found) throw new Error('message not received yet');
        return found;
      },
      { timeout: 2000, interval: 10 },
    );
  }

  close(): void {
    this.ws.close();
  }
}

describe('full WS flow: register, login, list, invite, accept, state push', () => {
  let dir: string;
  let server: ReturnType<typeof createAppServer>;
  let port: number;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'pm2-fullflow-'));
    const state = createServerState(new UserStore(join(dir, 'users.json')));
    server = createAppServer(state, join(dir, 'webroot'));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('drives the whole lobby flow end-to-end over real sockets', async () => {
    const alice = await TestClient.connect(port);
    const bob = await TestClient.connect(port);

    alice.send({ action: 'register', username: 'alice', password: 'longenough' });
    await alice.waitFor((m) => m.type === 'register_result' && m.success === true);

    bob.send({ action: 'register', username: 'bob', password: 'longenough' });
    await bob.waitFor((m) => m.type === 'register_result' && m.success === true);

    alice.send({ action: 'login', username: 'alice', password: 'longenough' });
    await alice.waitFor((m) => m.type === 'login_result' && m.success === true);

    bob.send({ action: 'login', username: 'bob', password: 'longenough' });
    await bob.waitFor((m) => m.type === 'login_result' && m.success === true);

    alice.send({ action: 'get_online_users' });
    const onlineList = await alice.waitFor((m) => m.type === 'online_users');
    expect(onlineList.users).toEqual(['bob']);

    alice.send({ action: 'send_invite', to: 'bob', difficulty: 'hard' });
    await alice.waitFor((m) => m.type === 'invite_result' && m.success === true);
    const received = await bob.waitFor((m) => m.type === 'invite_received');
    expect(received).toMatchObject({ from: 'alice', difficulty: 'hard' });

    bob.send({ action: 'respond_invite', from: 'alice', accept: true });

    await alice.waitFor((m) => m.type === 'invite_accepted' && m.partner === 'bob');
    await bob.waitFor((m) => m.type === 'invite_accepted' && m.partner === 'alice');

    const aliceState = await alice.waitFor((m) => m.type === 'state');
    const bobState = await bob.waitFor((m) => m.type === 'state');
    expect((aliceState.data as { yourSlot: number }).yourSlot).toBe(1);
    expect((bobState.data as { yourSlot: number }).yourSlot).toBe(2);

    alice.close();
    bob.close();
  });
});
