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
- [x] Make the vending machine tile impassable. Players use it by tapping it from a neighbouring tile, which opens the panel (playtest bug: a player could stand on the machine with no panel). Server checks adjacency in `vend`.
- [x] Meeting: the player who stepped on stays on that tile. The token glides in and recoils once. The arrows and server agree (playtest bug: arrows stayed on the other player's tile after the bounce).
- [x] Village screen shows only the countdown and the board. Tags and the accusation list are removed (playtest feedback). The newest accusation shows as a short notice for everyone.
- [x] Village background covers the whole phone frame, through the top to the bottom edge, via PhoneFrame.
- [x] Vending panel is a modal, and opens only when the player holds a duplicate (playtest question).
- [x] Tapping the machine without a duplicate shows a short hint above it for 3 seconds: its purpose and that no duplicates are held.
- [x] Layout: the frame is viewport-high with no page scrolling. The walkway and cards size from the available height (design/10 section 14).
- [ ] Check layout at 320x568, 375x667, 390x844, 430x932, and landscape. Endgame summary and long names not yet checked.
- [x] Village token shows the card count (last round summary) as a card-back badge above the player (design/04 rule 25).
- [x] Duel table: on screens 760 px tall or less, the two card slots sit side by side. Taller screens keep them stacked.
- [x] Card choices in the village (vending insert, accusation card) use the duel preview. Cards sit side by side; tapping one zooms it with its text and an action button, or Back (`CardChoice` organism).
- [x] Player icons: the server gives each seat a different one of eight icons at random. The icon shows in the header, the lobby list, and as the walkway token (design/10 section 2).
- [x] Card-count badge: plain sand card with a bold number, at the upper right of the player's icon.
- [x] Reconnect after the grace period is refused with GRACE_EXPIRED once a match has started (design/04 section 4.4).
- [x] A lobby with a dropped player's seat held is closed to new players. Fresh windows no longer fill it with ghost seats and auto-start it (playtest bug).
- [x] Card-count badge is a narrow card rectangle.
- [x] Challenge locks both players for the next round, at once. Full-screen CHALLENGE overlay for both, with animation. Locked players cannot act, and nobody walks onto them (design/10 section 15).
- [x] Movement arrows are white with a shadow. Tiles the player can move to are dimmed with a transparent black overlay.
- [x] Walkable-tile overlay pulses between light and dark (about 1.6 s cycle). Steady when the device asks for reduced motion.
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
