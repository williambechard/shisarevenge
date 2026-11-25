# Plan 05: Special cards

**Goal:** Protection Talisman, Ramen, and Shisa Mask work as written. Each is used once, and the interface shows its status.
**Source:** `design/07-implementation-plan.md` M4, `04-game-rules.md` sections 5, 6, and 12, `01-game-design.md` section 5.

## Steps

### Game logic

- [x] At setup, give each Survivor one of `protection-talisman` or `ramen` at random. Unit test the distribution with a seeded random function.
- [x] Committing a special marks it `spent` at reveal, whatever the outcome. Unit test a win, a loss, and a tie.
- [x] Shisa Mask: add +2 to the played value when committed, capped at 5. Unit test 1, 3, 4, and 5.
- [x] Protection Talisman: a committed Talisman blocks a freeze, even when the Army wins by a large margin. Unit test.
- [x] Ramen: a committed Survivor that wins against an Army member recovers that member. Unit test.
- [x] A tie spends committed specials and changes no teams. Unit test.
- [x] Shisa Mask is always fresh when given. Unit test a player who was frozen after using their Survivor special.

### Server events

- [x] Reject `useSpecial: true` with `SPECIAL_UNAVAILABLE` when the special is not `available`.
- [x] Put special results in `encounter:revealed` and `encounter:result` for the two participants only.
- [x] Send the lost-special notice on catch and on recover.

### Client

- [x] Build `SpecialCard` with three visible states: available, committed, and spent. Show each state with text and an icon, not only color.
- [x] Add the commit control to the Round screen. It sits next to the lock-in button.
- [x] Show the lost-special message after a catch or a recover.

### Checks

- [x] Every row in the special-card tables of `04-game-rules.md` has a passing test.
- [x] Test: no special status is visible to the opponent before the reveal.
- [x] Manual test: each special works once in a live match.

## Done when

All steps are checked. Every special-card rule has a passing test, and the lost message appears on screen for a caught player.
