import { describe, expect, it } from 'vitest';
import { SharedSession } from '../../src/session/SharedSession.js';

// Phase 3 exit criterion (plan.md): an integration test driving a full round (and a full game)
// through SharedSession's real advance()/completeTradeGate(), asserting the exact phase sequence
// from PortMasters2/server.py's mixed int/string phase enum (server.py:467).
function driveOneRound(session: SharedSession): unknown[] {
  const phases: unknown[] = [];
  session.advance(); // 0 (Fortune Tides) -> 5 (Procure dealt)
  phases.push(session.games[0]!.phase);
  session.advance(); // 5 -> 1 (Procure)
  phases.push(session.games[0]!.phase);
  session.advance(); // 1 -> trade (Barter)
  phases.push(session.games[0]!.phase);
  session.completeTradeGate(); // trade -> worker_mgmt (Artisans dealt)
  phases.push(session.games[0]!.phase);
  session.advance(); // worker_mgmt -> 2 (Artisans)
  phases.push(session.games[0]!.phase);
  session.advance(); // 2 -> 3 (Upkeep settled)
  phases.push(session.games[0]!.phase);
  session.advance(); // 3 -> 4 (Shipyard)
  phases.push(session.games[0]!.phase);
  session.advance(); // 4 -> 0 next round, or endgame
  phases.push(session.games[0]!.phase);
  return phases;
}

describe('SharedSession integration: full round phase sequence', () => {
  it('starts at phase 0 and visits every phase in order across one round', () => {
    const session = SharedSession.createPair('alice', 'bob', 'easy');
    expect(session.games[0]!.phase).toBe(0);
    expect(session.games[1]!.phase).toBe(0);

    const phases = driveOneRound(session);

    expect(phases).toEqual([5, 1, 'trade', 'worker_mgmt', 2, 3, 4, 0]);
    expect(session.games[0]!.phase).toBe(session.games[1]!.phase);
    expect(session.games[0]!.currentRound).toBe(2);
    expect(session.games[1]!.currentRound).toBe(2);
  });

  it('keeps both players in lockstep on phase and round across several rounds', () => {
    const session = SharedSession.createPair('alice', 'bob', 'easy');
    for (let i = 0; i < 3; i++) {
      driveOneRound(session);
    }
    expect(session.games[0]!.currentRound).toBe(4);
    expect(session.games[0]!.phase).toBe(session.games[1]!.phase);
    expect(session.games[0]!.gameOver).toBe(false);
  });
});

describe('SharedSession integration: full game reaches endgame', () => {
  it('cycles through every round on easy difficulty and ends at phase endgame', () => {
    const session = SharedSession.createPair('alice', 'bob', 'easy');
    const maxRounds = session.games[0]!.maxRounds;

    for (let round = 1; round <= maxRounds; round++) {
      driveOneRound(session);
    }

    expect(session.games[0]!.gameOver).toBe(true);
    expect(session.games[1]!.gameOver).toBe(true);
    expect(session.games[0]!.phase).toBe('endgame');
    expect(session.games[1]!.phase).toBe('endgame');
    expect(session.games[0]!.currentRound).toBe(maxRounds + 1);
  });
});
