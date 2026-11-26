# Plan 06: Polish and deploy

**Goal:** A playable, deployed build with placeholder art, tested on real phones.
**Source:** `design/07-implementation-plan.md` days 12 to 14 and section 3, `09-project-structure.md` section 3, `03-guardrails.md` section 10.

## Steps

### Feature freeze (day 12)

- [ ] Card preview: tapping a card enlarges it to fill most of the screen with its name and effect. Lock in moves to the preview, and the locked card flies to the table. Check it on a phone.
- [ ] Card animation (Motion and CSS 3D, see `design/02-tech-stack.md`): the fan, the card flip, and the move from the hand to the table. Check it on a phone in a live match.
- [ ] Confirm the feature freeze. After this step, only bug fixes and deployment work are allowed.
- [x] Scope change (steer after plan 05): special cards are played in place of a number, like the number cards. Design in `04-game-rules.md` section 5 and decision 19. Added here because plan 05 was already complete.
- [ ] Add placeholder SVG art to `client/src/assets/shisa/` and `client/src/assets/textures/`: a Shisa shape, bingata color bands, and a wind swirl.
- [ ] Add placeholder SVG card art to `client/src/assets/cards/` for the five numbers and the three specials.
- [ ] Shorten transitions to under 400 ms.
- [ ] Audit touch targets at 44 px.
- [ ] Gate the `/dev/components` route behind `import.meta.env.DEV`.
- [ ] Copy pass: use the terminology table everywhere in the UI.
- [ ] Check that `client/src/assets/` and `client/public/` total 2 MB or less.

### Deploy (day 13)

- [ ] Deploy `client` to Vercel with `VITE_SERVER_URL` set.
- [ ] Deploy `server` to Render with `CLIENT_ORIGIN` set.
- [ ] Open the Render health URL and confirm it responds.
- [ ] Confirm the "Server waking up" spinner shows on a cold start.

### Device tests (day 13)

- [ ] Full match with at least two phones on the deployed URL.
- [ ] iOS Safari: join, play a round, and see the reveal.
- [ ] Android Chrome if available: join, play a round, and see the reveal.
- [ ] Refresh mid-round keeps the seat.
- [ ] A phone that does not lock in is auto-locked after the timer.
- [ ] A lost special shows its message.
- [ ] Overview shows the winner, then Back to start returns to Landing.
- [ ] Layout has no horizontal scroll on a small phone.

### Submission (day 14)

- [ ] Fix blocking bugs found in device tests.
- [ ] Update `README.md` with how to run, deploy, and play.
- [ ] Tag the release.
- [ ] Record the deployed URL in `README.md`.

## Done when

All steps are checked. The deployed URL runs a full match on at least two real phones, and the release is tagged.
