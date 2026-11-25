# Plan 03: Core card duel

**Goal:** Two clients play a blind duel. Neither sees the other's card before both lock in. Played cards leave the hand.
**Source:** `design/07-implementation-plan.md` M2, `04-game-rules.md` sections 3 to 6 and 11, `08-socket-contract.md` sections 4 and 5.

## Steps

### Game logic (pure functions in `server/src/game/`)

- [x] `deck.ts`: create the full hand `[1, 2, 3, 4, 5]` for each player. Unit test.
- [x] `pairing.ts`: random pairing with the Warm-Up rule. The Warm-Up goes to the player with the fewest byes, and ties break at random. Unit test.
- [x] `pairing.ts`: no pair repeats the previous round's pair. Reshuffle up to 50 times, then keep the attempt with the fewest repeats. Unit test with 4, 5, and 8 players. The fallback differs from the spec's "least recent opponent" and is noted in `04-game-rules.md` as a known gap.
- [x] `encounterResolver.ts`: higher number wins, ties change nothing, and same-team duels change nothing. Unit test each case.
- [x] `gameEngine.ts`: phases `announce`, `pairing`, `selecting`, `revealed`, `resolved`. Unit test the transitions.
- [x] Invariant test: a card value never appears twice in one hand, and a used card never returns.
- [x] Invariant test: a Warm-Up player's hand does not change.

### Server events

- [x] Add Zod schema for `encounter:submit` with `value` 1 to 5 and `useSpecial` boolean.
- [x] Reject `encounter:submit` with `CARD_UNAVAILABLE`, `WRONG_PHASE`, `NOT_IN_ENCOUNTER`, or `ALREADY_LOCKED` as appropriate. Covered by engine tests.
- [x] Send `encounter:waiting` on each lock-in.
- [x] Send `encounter:revealed` only after both players of that duel lock in, per `04-game-rules.md` section 4.5. Each duel reveals on its own, not when the whole round is locked.
- [x] Send `encounter:result` and `player:private-state` to the two participants only.
- [x] Add the selection timer (45 seconds). On timeout, auto-lock the lowest card with no special, and send `player:notice` `auto-locked` to that player.
- [x] Send `round:paired` with pairings and the Warm-Up player.
- [x] Add `game:start` for the host, which needs 4 to 8 ready players. Not in the original step list, but the duel cannot start without it.
- [x] Resync a rejoining player to the running game (`game:started`, `round:paired`, and private state).

### Client

- [x] Build the Round screen. The opponent and timer sit in its header, and the `EncounterPanel` organism from `06-atomic-design.md` was folded into it.
- [x] Build the `HandTray` organism with `NumberCard` molecules.
- [x] Build the `RevealPanel` organism.
- [x] Show "Waiting for opponent" after lock-in.
- [x] Show "Auto-locked" when the timer locked the card.
- [x] Used cards stay in the hand row with a struck-through style, not removed. Removing them would change the layout while the player is choosing.

### Hidden-information checks

- [x] Test: the payloads sent before both players of a duel lock in contain no opponent `value` or `useSpecial`.
- [x] Test: `room:state` never contains `hand` or lock-in data. Checked during the timeout test.
- [ ] Manual test: two phones or two windows play a duel. Neither sees the other's choice early.

## Done when

All steps are checked. Two clients complete a blind duel, the reveal is simultaneous, and no early leak appears in the tests. The manual check is still open, so this plan stays in `wip/` until someone plays a duel on two devices.

## Notes

- The timer lasts 45 seconds. The socket test uses a 5 second timer so it runs quickly.
- Team changes are not applied in this plan. Duels report `caughtCold` in their results, and plan 04 applies them.
- Special cards are rejected with `SPECIAL_UNAVAILABLE` until plan 05.
