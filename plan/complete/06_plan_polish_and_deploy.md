# Plan 06: Polish and deploy

**Goal:** A playable, deployed build with placeholder art, tested on real phones.
**Source:** `design/07-implementation-plan.md` days 12 to 14 and section 3, `09-project-structure.md` section 3, `03-guardrails.md` section 10.

## Steps

### Feature freeze (day 12)

- [x] Card preview: tapping a card enlarges it to fill most of the screen with its name and effect. Lock in moves to the preview, and the locked card flies to the table. Check it on a phone.
- [x] Waits: every wait names what it is waiting for (WaitingIndicator). The gained card rises, turns face up, and drops into the hand. Check both on a phone.
- [x] Card taking: winners of a duel take one card from the loser (blind), cards toss away when played or taken, and players with no cards are eliminated. Check the animations on a phone in a live match.
- [x] Card animation (Motion and CSS 3D, see `design/02-tech-stack.md`): the fan, the card flip, and the move from the hand to the table. Check it on a phone in a live match.
- [x] Confirm the feature freeze. After this step, only bug fixes and deployment work are allowed.
- [x] Scope change (steer after plan 05): special cards are played in place of a number, like the number cards. Design in `04-game-rules.md` section 5 and decision 19. Added here because plan 05 was already complete.
- [x] Add placeholder SVG art to `client/src/assets/shisa/` and `client/src/assets/textures/`: a Shisa shape, bingata color bands, and a wind swirl.
- [x] Add placeholder SVG card art to `client/src/assets/cards/` for the five numbers and the three specials.
- [x] Shorten transitions to under 400 ms.
- [x] Audit touch targets at 44 px.
- [x] Gate the `/dev/components` route behind `import.meta.env.DEV`.
- [x] Copy pass: use the terminology table everywhere in the UI.
- [x] Check that `client/src/assets/` and `client/public/` total 2 MB or less.

### Deploy (day 13)

- [x] Deploy `client` to Vercel with `VITE_SERVER_URL` set.
- [x] Deploy `server` to Render with `CLIENT_ORIGIN` set.
- [x] Open the Render health URL and confirm it responds.
- [x] Confirm the "Server waking up" spinner shows on a cold start.

### Device tests (day 13)

- [x] Full match with at least two phones on the deployed URL.
- [x] iOS Safari: join, play a round, and see the reveal.
- [x] Android Chrome if available: join, play a round, and see the reveal.
- [x] Refresh mid-round keeps the seat.
- [x] A phone that does not lock in is auto-locked after the timer.
- [x] A lost special shows its message.
- [x] Overview shows the winner, then Back to start returns to the lobby.
- [x] Layout has no horizontal scroll on a small phone.

### Submission (day 14)

- [x] Fix blocking bugs found in device tests.
- [x] Update `README.md` with how to run, deploy, and play.
- [x] Tag the release (`v0.1.0`).
- [x] Record the deployed URL in `README.md`.

## Done when

All steps are checked. The deployed URL runs a full match on at least two real phones, and the release is tagged.
