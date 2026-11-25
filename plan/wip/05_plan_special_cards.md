# Plan 05: Special cards

**Goal:** Protection Talisman, Ramen, and Shisa Mask work as written. Each is used once, and the interface shows its status.
**Source:** `design/07-implementation-plan.md` M4, `04-game-rules.md` sections 5, 6, and 12, `01-game-design.md` section 5.

## Steps

### Game logic

- [ ] At setup, give each Survivor one of `protection-talisman` or `ramen` at random. Unit test the distribution with a seeded random function.
- [ ] Committing a special marks it `spent` at reveal, whatever the outcome. Unit test a win, a loss, and a tie.
- [ ] Shisa Mask: add +2 to the played value when committed, capped at 5. Unit test 1, 3, 4, and 5.
- [ ] Protection Talisman: a committed Talisman blocks a freeze, even when the Army wins by a large margin. Unit test.
- [ ] Ramen: a committed Survivor that wins against an Army member recovers that member. Unit test.
- [ ] A tie spends committed specials and changes no teams. Unit test.
- [ ] Shisa Mask is always fresh when given. Unit test a player who was frozen after using their Survivor special.

### Server events

- [ ] Reject `useSpecial: true` with `SPECIAL_UNAVAILABLE` when the special is not `available`.
- [ ] Put special results in `encounter:revealed` and `encounter:result` for the two participants only.
- [ ] Send the lost-special notice on catch and on recover.

### Client

- [ ] Build `SpecialCard` with three visible states: available, committed, and spent. Show each state with text and an icon, not only color.
- [ ] Add the commit control to the Round screen. It sits next to the lock-in button.
- [ ] Show the lost-special message after a catch or a recover.

### Checks

- [ ] Every row in the special-card tables of `04-game-rules.md` has a passing test.
- [ ] Test: no special status is visible to the opponent before the reveal.
- [ ] Manual test: each special works once in a live match.

## Done when

All steps are checked. Every special-card rule has a passing test, and the lost message appears on screen for a caught player.
