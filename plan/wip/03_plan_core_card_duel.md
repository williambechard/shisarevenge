# Plan 03: Core card duel

**Goal:** Two clients play a blind duel. Neither sees the other's card before both lock in. Played cards leave the hand.
**Source:** `design/07-implementation-plan.md` M2, `04-game-rules.md` sections 3 to 6 and 11, `08-socket-contract.md` sections 4 and 5.

## Steps

### Game logic (pure functions in `server/src/game/`)

- [ ] `deck.ts`: create the full hand `[1, 2, 3, 4, 5]` for each player. Unit test.
- [ ] `pairing.ts`: random pairing with the Warm-Up rule. The Warm-Up goes to the player with the fewest byes, and ties break at random. Unit test.
- [ ] `pairing.ts`: no pair repeats the previous round's pair. Reshuffle up to 50 times, then fall back to the least recent opponent. Unit test with 4, 5, and 8 players.
- [ ] `encounterResolver.ts`: higher number wins, ties change nothing, and same-team duels change nothing. Unit test each case.
- [ ] `gameEngine.ts`: phases `announce`, `pairing`, `selecting`, `revealed`, `resolved`. Unit test the transitions.
- [ ] Invariant test: a card value never appears twice in one hand, and a used card never returns.
- [ ] Invariant test: a Warm-Up player's hand does not change.

### Server events

- [ ] Add Zod schema for `encounter:submit` with `value` 1 to 5 and `useSpecial` boolean.
- [ ] Reject `encounter:submit` with `CARD_UNAVAILABLE`, `WRONG_PHASE`, `NOT_IN_ENCOUNTER`, or `ALREADY_LOCKED` as appropriate.
- [ ] Send `encounter:waiting` on each lock-in.
- [ ] Send `encounter:revealed` only after both players lock in or auto-lock.
- [ ] Send `encounter:result` and `player:private-state` to the two participants only.
- [ ] Add the selection timer (45 seconds). On timeout, auto-lock the lowest card with no special.
- [ ] Send `round:paired` with pairings and the Warm-Up player.

### Client

- [ ] Build the Round screen with `EncounterPanel`, `HandTray`, and `NumberCard`.
- [ ] Build the `RevealPanel` organism.
- [ ] Show "Waiting for opponent" after lock-in.
- [ ] Show "Auto-locked" when the timer locked the card.
- [ ] Remove used cards from the hand display.

### Hidden-information checks

- [ ] Test: the payloads sent before both players lock in contain no opponent `value` or `useSpecial`.
- [ ] Test: `round:state` never contains `hand`, `special`, or `encounter` data.
- [ ] Manual test: two phones or two windows play a duel. Neither sees the other's choice early.

## Done when

All steps are checked. Two clients complete a blind duel, the reveal is simultaneous, and no early leak appears in the tests.
