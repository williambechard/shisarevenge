# Plan 04: Teams, infection, and win conditions

**Goal:** A Shisa's Army member can catch a Survivor. Team counts and the round banner update only at round summary. The match ends with a clear winner and an overview.
**Source:** `design/07-implementation-plan.md` M3, `04-game-rules.md` sections 7 to 9 and 12, `01-game-design.md` sections 3, 6, and 13, `08-socket-contract.md` section 4.

## Steps

### Game logic

- [x] Choose the origin at random during setup. Give it team `infected`. The Shisa Mask part waits for plan 05, since special cards come later. Covered by the full-match test, which checks that at least one player starts infected.
- [x] `teamChanges.ts`: `catchCold`. Flips a Survivor to `infected`. Unit test.
- [x] `teamChanges.ts`: `recover`. Flips an Army member back to `survivor`. Unit test. Not yet called, because recovery needs the Ramen card from plan 05.
- [x] Freeze rule: an Army win over a Survivor catches the Survivor. A tie or a Survivor win changes nothing. Engine tests.
- [x] Add a notice for each change. `caught-cold` goes to the caught player only. The `recovered` notice waits for plan 05.
- [x] `winConditions.ts`: check in the order from `04-game-rules.md` section 9. Unit test each path.
- [x] Round progression: the match ends after round five, or earlier when a win check passes.
- [x] Record `caughtCount` for each round. `recoveredCount` stays 0 until plan 05.

### Server events

- [x] Send `round:ended` with `teamCounts`, `caughtCount`, and `recoveredCount`.
- [x] Keep `teamCounts` at the last round summary value in `room:state`. Counts change only in the round summary.
- [x] Send `player:notice` to the affected player only.
- [x] Send `game:ended` with `EndgameSummary`, including the transformation history.

### Client

- [x] Role display: the top bar shows "You are {name} · {team}". This replaces a separate `RoleCard`.
- [x] Build `TeamBar`: one segment per player, the Army win point in the caption, and round ticks.
- [x] Build the `Announcement` banner. It reads "N players caught a cold" or "No one caught a cold," and never names a player.
- [x] The result view is folded into the Round screen, which shows the reveal, the outcome, and the next round. There is no separate `ResultScreen`.
- [x] Build the endgame overview (`EndgameSummary`): the winner, counts, origin, and each player's history.
- [x] Add the Back to start button. It leaves the room and places the player again.
- [x] Show the caught message on the affected player's screen. The lost-special message waits for plan 05.

### Checks

- [x] Test: an Army member beats a Survivor. The Survivor's state shows the new team. The counts change, and no name is announced. Covered by the engine test and the full-match test.
- [x] Test: each win path ends the match with the right winner. Covered by `winConditions.test.ts`.
- [ ] Manual test: the Back to start button returns the player to a fresh lobby, and a new room can be started from there.

## Done when

All steps are checked. A full match from setup to overview to Back to start runs in tests, and the manual check passes.

## Notes

- The full-match test runs five rounds with 15 ms timers. Every player is auto-locked, so the test covers the round loop and the endgame without any client.
- The caught-cold notice uses the same `shisa-mask` value that plan 05 will add. Until then, the client only shows the text.
