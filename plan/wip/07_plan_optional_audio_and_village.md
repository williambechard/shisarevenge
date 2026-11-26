# Plan 07: Optional audio and village

**Goal:** Sound and a post-match village with preset emotes. Start only when plans 01 to 06 are complete, or when days 10 to 12 finish early.
**Source:** `design/01-game-design.md` sections 7, 8, and 13, `design/07-implementation-plan.md` cut list, `design/09-project-structure.md` audio rules, `design/08-socket-contract.md` section 3.

## Steps

### Audio

- [ ] Add the audio helper in `client/src/` that imports files from `client/src/assets/audio/`.
- [ ] Add about six MP3 sound effects: card lock-in, reveal, freeze, recover, shield block, and round start. Each is under 100 KB and named `sfx-<event>.mp3`.
- [ ] Add one looping background track, under 1 MB, named `bgm-lobby.mp3`.
- [ ] Start music after the first tap on Create Game or Join Game.
- [ ] Add the mute toggle on every screen. Save the choice in `localStorage`.
- [ ] Add audio credits to `CREDITS.md`.

### Village

- [ ] Add the Village screen with a fixed grid, tap-to-move, and up to 8 avatars.
- [x] Walk to any walkway or vending tile reachable through open tiles, not only a neighbour. Added because players could not reach most walkway tiles in one step.
- [x] Reverted the reachable-tiles rule at the player's request. Movement is one tile at a time (up, down, left, right). The board has no blocked tiles, so every tile is reachable. Design in `design/10-village.md` section 3.
- [x] Show a direction arrow on every reachable tile, pointing from the player's token.
- [x] Glide tokens between tiles with ease-in/out, with squash and stretch along the path of travel.
- [ ] Playtest the movement feel and arrows on a phone.
- [ ] Server validates each move and limits position updates to 5 per second per socket.
- [ ] Add `emote:send` with the preset list from `shared/constants.ts`. Limit it to 1 emote per 3 seconds.
- [ ] Add `emote:shown` to the room. Show the emote bubble over the avatar.
- [ ] Add the `EmoteBar` molecule.
- [ ] Overview leads to the Village, then Back to start.
- [ ] The room stays open until the last player leaves, then closes.

### Checks

- [ ] Test: emotes outside the preset list are rejected.
- [ ] Test: a fifth position update in one second is rate limited.
- [ ] Manual test: four players move, see each other, and send emotes.

## Done when

All steps are checked, or the plan is moved to the parking lot by decision and noted in this file.

## Stretch goal: exchange machine in the village

- [ ] Between matches, players can walk the village. One stop is an exchange machine. A player puts in a duplicate number card and receives a random card. A special card is possible but not guaranteed. Design it in `design/01-game-design.md` before building. Needs the card-taking rules in `design/04-game-rules.md` section 4.6 first.
