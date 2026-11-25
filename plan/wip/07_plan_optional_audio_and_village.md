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
