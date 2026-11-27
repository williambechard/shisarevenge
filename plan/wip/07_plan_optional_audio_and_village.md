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
- [x] Walkable-tile overlay pulses between light and dark (about 1.6 s cycle, between 25% and 40% black). Steady when the device asks for reduced motion.
- [x] The vending machine tile is walkable. Stepping onto it opens the panel when a duplicate is held, or shows the hint.
- [x] Entering a round clears last round's text (playtest bug): the duel starts fresh when the room enters the announce step.
- [x] Round summary explains a cold when anyone catches one: switching sides, and the lost Survivor special (playtest question).
- [x] The player who catches a cold gets a full-screen overlay, shown to them only: they switched to Shisa's Army, their goal changes, their lost special, and the Shisa Mask they now have (`ColdOverlay`, design/04 section 7).
- [x] Shisa mask on revealed Shisa's Army players, on the walkway token (design/10 section 16). Tuned, and the test line in VillageScreen is removed.
- [x] Team line is one bar showing each team's share of the room, on the duel and village screens (`TeamBar`, `BarFill`). Replaces the tick line.
- [x] Team bar shows the Cursed Shisa's Army share from the start. The server sent zero counts to clients (playtest bug). Team counts now come from the room.
- [x] Village and duel timers are a circular ring (`RingTimer`) beside the team bar, with no text. It starts full and empties at the deadline. The pick panel uses it too.
- [x] Team bar and timer sit on a dark backing, so their text and ring read on the village photo and the sand duel background. The backing is kept small.
- [x] Music by screen: lobby, duel, village. Story is registered but waits for the story screen. Starts at the first tap (design/11 section 1).
- [x] Sound effects: select, no, bad, success, step, and the 10-second tick that speeds up (design/11 section 2).
- [x] Mute toggle on every screen, saved in localStorage (design/11 section 3).
- [x] Select sound on every card tap (hand, card choice, pick panel). Success chime when bumping into a player or the vending machine.
- [x] A player cannot step again while a meeting is open: the bounce and the overlay come first (playtest bug: a quick second step skipped the overlay).
- [x] Accusing closes the meeting overlay. The result shows as the village notice, so the player is back to moving.
- [ ] Playtest audio on phones: music start after the first tap, tick speed, and mute.
- [x] Music compressed to MP3 at 80 to 96 kbps. Every track is under 1 MB (duel is 899 KB). Originals are in design/art-source/audio/music.
- [x] Story screen (design/12): full screen after the room first starts, before the first village. Skip goes to the village. The village timer waits until every connected player is past the story.
- [x] Story pictures load from `client/src/assets/story/` in filename order. The story track plays on this screen.
- [x] Story pages auto-advance every 5 seconds, and the story ends itself after the last page. The server opens the village after 60 seconds even if a client never reports done.
- [x] Village tour after the story: five 5-second tips with arrows (team bar, timer, vending machine, own token, another player). Design/12 section 6.
- [ ] Add the story pictures in `client/src/assets/story/` (none yet).
- [ ] Playtest the story flow: page animation, Skip, and the village timer starting after the last player.
- [ ] Playtest the movement feel and arrows on a phone.
- [ ] Optional art: a cold or wind graphic for the cold overlay, placed in `client/src/assets/shisa/` (the overlay works without it).
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
