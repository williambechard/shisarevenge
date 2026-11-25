# Plan 04: Teams, infection, and win conditions

**Goal:** A Shisa's Army member can catch a Survivor. Team counts and the round banner update only at round summary. The match ends with a clear winner and an overview.
**Source:** `design/07-implementation-plan.md` M3, `04-game-rules.md` sections 7 to 9 and 12, `01-game-design.md` sections 3, 6, and 13, `08-socket-contract.md` section 4.

## Steps

### Game logic

- [ ] Choose the origin at random during setup. Give it team `infected` and a fresh `shisa-mask`. Unit test.
- [ ] `teamChanges.ts`: `catchCold`. Set the team to `infected`, mark an available Survivor special as `lost`, and give a fresh Shisa Mask. Unit test.
- [ ] `teamChanges.ts`: `recover`. Set the team to `survivor`, mark the Shisa Mask as `lost`, and give a random Survivor special. Unit test.
- [ ] Freeze rule: an Army win over a Survivor catches the Survivor. A tie or Survivor win changes nothing. Unit test.
- [ ] Add a notice for each change: `caught-cold` or `recovered`, with the lost special.
- [ ] `winConditions.ts`: check in the order from `04-game-rules.md` section 9. Unit test each path.
- [ ] Round progression: end the match after round five.
- [ ] Record `caughtCount` and `recoveredCount` for each round from the team changes.

### Server events

- [ ] Send `round:ended` with `teamCounts`, `caughtCount`, and `recoveredCount`. Send it after every encounter resolves.
- [ ] Keep `teamCounts` at the last round summary value in `room:state`. Test that a mid-round freeze does not change it.
- [ ] Send `player:notice` to the affected player only.
- [ ] Send `game:ended` with `EndgameSummary`, including the transformation history.

### Client

- [ ] Build `RoleCard` on the role reveal screen.
- [ ] Build `TeamBar` with one segment per player, the 100% marker, five round ticks, and a text caption.
- [ ] Build the `Announcement` banner. It reads "N players caught a cold this round," or says that no one did. It never names a player.
- [ ] Build `ResultScreen` with the duel result and the next-round control.
- [ ] Build `EndgameSummary` for the overview: winner, counts, origin, and history.
- [ ] Add the Back to start button. It leaves the room and returns to the Landing screen.
- [ ] Show the lost-special message on the affected player's screen.

### Checks

- [ ] Test: an Army member beats a Survivor. The Survivor's private view shows the new team. The room's counts change, and no name is announced.
- [ ] Test: each win condition path ends the match with the right winner.
- [ ] Test: the Back to start button returns to Landing, and a new room can be created.

## Done when

All steps are checked. A full five-round match from setup to overview to Back to start runs in tests and manually.
