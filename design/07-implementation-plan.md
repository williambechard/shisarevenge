# 07. Implementation Plan (2-Week Jam)

**Status:** Locked. Scope is the "Must have" list in `01-game-design.md` section 13. Work in the order below. Each task has an acceptance check.

## 1. Schedule

| Days | Milestone | Ends with |
|---|---|---|
| 1 to 2 | M0 Setup and M1 Multiplayer foundation | Four phones see the same lobby |
| 3 to 6 | M2 Core card duel | Two clients play a blind duel with no early reveal |
| 7 to 9 | M3 Teams, infection, and win conditions | A Shisa's Army member catches a Survivor; win checks work |
| 10 to 11 | M4 Special cards | All three special cards resolve correctly and show status |
| 12 | Feature freeze, UI polish, placeholder art | No new features after this day |
| 13 | Deploy, device tests, and fixes | Full match on the deployed URL with two phones |
| 14 | Buffer and submission | Build uploaded and the README is final |

If a milestone slips by more than a day, use the cut list in section 4.

## 2. Tasks

### M0: Setup (day 1)

- [ ] Create the npm workspace: `client`, `server`, `shared`.
- [ ] Configure TypeScript strict in each package.
- [ ] Configure ESLint (flat config), Prettier, and Vitest.
- [ ] Add root scripts from `05-coding-standards.md` section 12.
- [ ] Add `.gitignore`, `.env.example`, and `README.md` skeleton.
- [ ] Create the GitHub repo and push.

**Check:** `npm run lint`, `npm run typecheck`, and `npm test` run with no errors, even with no tests yet.

### M1: Multiplayer foundation (days 1 to 2)

- [ ] Express server with `/health`, Socket.IO attached, and CORS limited to `CLIENT_ORIGIN`.
- [ ] Zod schemas for `room:enter` and `room:leave`. (Changed by the auto-placement steering: no create, join, or ready events.)
- [ ] Room registry with automatic placement, assigned names, and expiry.
- [ ] Session tokens and reconnect by token.
- [ ] Lobby state broadcast to everyone in the room.
- [ ] Client: Lobby screen. (Changed: no Landing or Join screens. The page places the player on load.)
- [ ] Client: socket connection with reconnect status shown.
- [ ] "Server waking up" spinner, shown while the first connection is pending.
- [ ] QR code on the lobby screen. (Removed by the auto-placement steering.)

**Check:** Four phones (or four browser windows) join one room and see the same player list. Refreshing one window keeps the same seat.

### M2: Core card duel (days 3 to 6)

- [ ] `pairing.ts` with random pairs and the Warm-Up rule. Unit tests.
- [ ] `deck.ts` with initial hands. Unit tests.
- [ ] `encounterResolver.ts` for the numbers only (no specials yet). Unit tests for higher wins, ties, and same-team duels.
- [ ] Phase flow: announce, pairing, selecting, revealed, resolved.
- [ ] `encounter:submit` handling with validation and lock-in.
- [ ] Server sends `encounter:waiting` on lock-in and `encounter:revealed` only after both locks.
- [ ] Selection timer with auto-lock on timeout.
- [ ] Client: Round screen, HandTray, NumberCard, EncounterPanel, RevealPanel.
- [ ] Hidden-information test for the submit flow.

**Check:** Two clients play a duel. Neither client's payload shows the opponent's card before both lock in. Used cards disappear from the hand.

### M3: Teams, infection, and win conditions (days 7 to 9)

- [ ] Assign origin at setup. Unit test.
- [ ] `teamChanges.ts`: `catchCold` and `recover`. Unit tests.
- [ ] Freeze rule: an Army win against a Survivor catches the Survivor.
- [ ] Private message for newly caught player.
- [ ] `winConditions.ts` with the order in `04-game-rules.md` section 9. Unit tests for each path.
- [ ] Round progression to five rounds.
- [ ] Public team counts.
- [ ] Client: RoleCard, TeamBar, ResultScreen, EndgameSummary.
- [ ] Team bar updates only on round summary. Test that a mid-round freeze does not change the bar.
- [ ] Round-summary announcement banner, built from public count changes only.

**Check:** A Shisa's Army member beats a Survivor. The Survivor's screen shows the new team privately. The room's counts change, and no name is announced.

### M4: Special cards (days 10 to 11)

- [ ] Assign survivor specials at setup (Talisman or Ramen at random).
- [ ] Commit logic for each special. Spend on commit. Unit tests.
- [ ] Protection Talisman blocks a freeze.
- [ ] Ramen recovers on a winning Survivor duel.
- [ ] Shisa Mask adds +2, capped at 5. Given to origin and newly caught players.
- [ ] Lost-special message on catch and on recover.
- [ ] Client: SpecialCard with available, committed, and spent states, plus text labels.

**Check:** Every row of the special-card table in `04-game-rules.md` has a passing test. The lost message appears on screen for a caught player.

### Day 12: Feature freeze and polish

- [ ] Placeholder art: SVG shisa shape, bingata color bands, wind swirl.
- [ ] Transitions shortened to under 400 ms.
- [ ] Touch targets audited at 44 px.
- [ ] Remove or gate `/dev/components`.
- [ ] Final pass on copy using the terminology table.

### Day 13: Deploy and device tests

- [ ] Deploy `client` to Vercel with `VITE_SERVER_URL` set.
- [ ] Deploy `server` to Render with `CLIENT_ORIGIN` set.
- [ ] Confirm the server health URL responds before the test match.
- [ ] Full match with at least two phones: one iOS Safari, one Android Chrome if available.
- [ ] Test: reconnect by refreshing mid-round.
- [ ] Test: a player's phone locks after the timer, and auto-lock applies.
- [ ] Test: a lost special shows the message.
- [ ] Test: a match ends with a clear winner on the endgame overview.
- [ ] Test: Back to start places the player again, in an open lobby or a new room.

### Optional: post-match village and emotes

Build only if days 10 to 12 finish early. Otherwise move this block to the parking lot.

- [ ] Village screen with a fixed grid, tap-to-move, and up to 8 avatars.
- [ ] Server validates moves and limits position updates to 5 per second per socket.
- [ ] Emote bar and emote bubbles over avatars, using the preset list.
- [ ] Overview leads to the village, then Back to start.
- [ ] Room stays open until the last player leaves, then closes.

**Check:** Four players can move, see each other, and send emotes.

### Day 14: Submission

- [ ] README covers how to run, deploy, and play.
- [ ] Tag the release.
- [ ] Record the deployed URL.

## 3. Manual test checklist (party readiness)

- [ ] Create a room on the deployed URL.
- [ ] Open the game on two phones and check automatic placement into the same room.
- [ ] Four to eight players join without errors.
- [ ] Room starts automatically when the eighth player enters.
- [ ] Role reveal shows the correct private role.
- [ ] Each round pairs players and shows the Warm-Up when needed.
- [ ] Lock-in shows "waiting" until the opponent locks in.
- [ ] Reveal is simultaneous.
- [ ] Each special card works once.
- [ ] A lost special message appears.
- [ ] A refresh keeps the same seat.
- [ ] Endgame shows the winner and the Shisa's identity.
- [ ] Overview, then Back to start, places the player again.

## 4. Cut list

If the schedule slips, cut in this order. The first item is cut first.

1. Sound effects and background music. Audio is optional, so it goes first.
2. Lobby seat counter styling. Keep plain text.
3. Animations beyond a simple fade.
4. Endgame transformation history. Keep the winner and counts.
5. Announcement banner styling. Keep plain text.
6. Placeholder art polish. Keep flat colors and text.
7. Reconnect beyond the 120-second grace period.

Do not cut: the blind selection, the hidden-information rules, the win conditions, the three special cards, or the lost-special message.

## 5. Parking lot (after the jam)

- Awards on the endgame screen
- Player-chosen opponents, with a pick window before pairing
- In-match emotes as a stretch goal (usable as bluffs), and proximity
- Village and emotes beyond the preset list
- Rematch
- Round events
- Additional special cards
- Rematch
- Kick from lobby
- Balance tuning from playtest data

## 6. Risks

| Risk | Mitigation |
|---|---|
| Render sleeps during the party | Wake it 10 minutes before the event. The "Server waking up" message covers the wait on first connect. |
| Hidden-information bug | Unit test and payload test in M2. Check again on day 13. |
| Scope creep | Feature freeze on day 12. Parking lot for new ideas. |
| Phone layout breaks | Build with the `/dev/components` route and test on a real phone by day 6. |
| Rules disagree between docs and code | `04-game-rules.md` is the spec. Update it before changing code. |
