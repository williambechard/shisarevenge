# Shisa Revenge: Game Design Document

**Version:** 1.1
**Status:** Design locked for the 2-week game jam build. Changes need a note in the changelog at the end of this file.
**Source:** Supersedes `frostys-revenge-design-doc.md`, which is kept as reference only.
**Platform:** Mobile-friendly web game (phones join from a browser, no install).
**Players:** 8 per match. A room starts when it is full.
**Session length:** About 10 to 15 minutes
**Genre:** Social deduction, hidden information, push-your-luck card duels
**Language:** English only

Detailed rules live in `04-game-rules.md`. If this file and that file disagree, `04-game-rules.md` wins.

---

## 1. High concept

**Shisa Revenge** is a winter party card game set in Okinawa.

A guardian Shisa, the lion-dog statue that protects gates and rooftops across the islands, has been cursed. It rides the cold north wind of winter and gives people a *kaze*, a cold that spreads from person to person. One player begins as the Cursed Shisa. Anyone who catches a cold from the Shisa joins the Shisa's Army and can help spread the curse.

Each encounter resolves through a simultaneous, blind choice of numbered cards. Players decide when to spend their strongest cards, when to save them, and whom they can trust.

Players open the game on their own phone. The server places them in a room automatically, with no code and no account. No app is needed.

### Design pillars

1. **Blind decisions:** Players commit to a number before they see the opponent's choice.
2. **Changing teams:** A player who catches a cold switches sides and stays in the game.
3. **Resource tension:** Number cards are limited and cannot be reused in a match.
4. **Social uncertainty:** Players talk, bluff, bargain, and mislead one another.
5. **Fast party pacing:** Short rounds, simple rules, and no player elimination.

---

## 2. Theme and world

### Premise

It is winter in Okinawa. The air is mild but the north wind is cold. The guardian Shisa on the village gate has been cursed by an ancient winter spell. It is spreading colds through the village, and it is building an army to take over the island before the New Year.

The survivors have a few useful things: a Bingata Shawl, a cup of Hot Shikuwasa, and a Shisa Mask they can take from the Shisa itself. They must last until the countdown ends, or recover enough of the village to break the curse.

### Tone and visual direction

- **Tone:** Playful folklore horror. Mischievous and spooky, never graphic.
- **Visual style:** Bold illustrated storybook art. Shisa statues, sea and sky, and winter-wind swirls.
- **Palette:** Sea blue, coral red, shisa red, bingata colors (indigo, yellow, green, and pink), sand white, and warm gold. Team state never relies on color alone.
- **Cursed Shisa:** A recognizable guardian lion with a red face, open mouth, and glowing eyes. Wind lines trail behind it.
- **Transformation:** A player's avatar gets a shisa-style mask overlay, a cold-wind effect, and changes team badge.
- **Interface:** Large readable cards and buttons for one-handed phone use.

### Terminology

| Game concept | In-game term |
|---|---|
| Initial infected player | Cursed Shisa |
| Infected team | Shisa's Army |
| Uninfected team | Survivors |
| Infection | Catch a Cold |
| Cure | Recover |
| Quarantine | Bed Rest |
| Infection attack | Cold Breath |
| Healing item | Hot Shikuwasa |
| Protective item | Bingata Shawl |
| Infected-player item | Shisa Mask |
| Match timer | Countdown to New Year |

Numbered cards:

| Value | Card name |
|---|---|
| 1 | Mist |
| 2 | Breeze |
| 3 | Gust |
| 4 | Kitakaze |
| 5 | Squall |

---

## 3. Players, roles, and objective

### Player count

- Minimum: 4
- Recommended: 5 to 6
- Maximum: 8

### Starting teams

- One player is randomly chosen as the **Cursed Shisa**.
- All other players start as **Survivors**.
- The Cursed Shisa is publicly known as the origin.
- Identities of later frozen players are private to that player unless the game or discussion reveals them.
- When a Survivor catches a cold, they join Shisa's Army.
- Shisa's Army members do not learn who their teammates are. This keeps the unknown factor that drives the tension.

The game never eliminates a player. Players who catch a cold keep playing.

### Win conditions

The game lasts **five rounds**.

- **Shisa's Army wins immediately** if every player is on Shisa's Army.
- **Survivors win immediately** if no player is on Shisa's Army.
- **Survivors win** if at least one Survivor remains when round five ends.
- Otherwise, **Shisa's Army wins** when round five ends.

The objective is simple: spread the cold before the countdown ends.

---

## 4. Core numbered-card mechanic

This is the heart of the game.

### Number cards

Each player starts with the same five numbered cards:

| Value | Name | Used |
|---|---|---|
| 1 | Mist | Once per game |
| 2 | Breeze | Once per game |
| 3 | Gust | Once per game |
| 4 | Kitakaze | Once per game |
| 5 | Squall | Once per game |

Played cards are discarded and do not return during the match.

### Encounter flow

Each round, the server pairs players into encounters. Each player in an encounter:

1. Sees their opponent.
2. Secretly selects one unused numbered card.
3. Optionally commits their special card.
4. Locks in the choice.
5. Waits until both players lock in.
6. Sees both choices revealed at the same time.

The higher number wins the duel. The server never reveals either choice before both players lock in. The server is authoritative and resolves every duel.

### What winning means

| Matchup | Result |
|---|---|
| Shisa's Army beats Survivor | Survivor catches a cold and joins Shisa's Army |
| Survivor beats Shisa's Army | Survivor repels the Cold Breath. No team change. |
| Tie between a Survivor and Shisa's Army member | The attack fails. No team change. |
| Survivor vs. Survivor | No team change. Higher card wins the encounter. |
| Shisa's Army vs. Shisa's Army | No team change. Higher card wins the encounter. |

A tie never causes a team change.

Even without infection, a duel matters. It reveals card-use patterns, uses up valuable numbers, and creates doubt about what an opponent has left.

### Card exhaustion

- A player may select only a numbered card they still have.
- Used cards appear in that player's personal discard area.
- Opponents cannot see a player's hand or discard pile.
- Under the current pairing rules, a player has one card left in every round, so exhaustion cannot happen before round five. The rule stays in the engine as a safety net. See `04-game-rules.md`.

### Pairing and odd player counts

- The server randomly pairs all active players at the start of each round.
- With an odd number of players, one player receives a **Warm-Up** (bye) and does not duel that round.
- The bye rotates. The player with the fewest bye rounds so far receives the next bye, and ties are broken at random.
- Players cannot choose their opponent in this version. Player-chosen pairing is parked for after the jam.
- A player never faces the same opponent in two consecutive rounds. If no valid pairing is found after 50 shuffles, the engine pairs each player with the opponent they faced least recently.
- Pairings are visible before card selection begins.

---

## 5. Special cards

Each player has one special card. The server assigns it by team.

| Card | Given to | Effect |
|---|---|---|
| **Bingata Shawl** | Survivors (see note) | Once per game. If committed, it blocks one incoming Cold Breath. The duel still happens and both numbers are spent. |
| **Hot Shikuwasa** | Survivors (see note) | Once per game. If committed and the Survivor wins a duel against a Shisa's Army member, that member recovers. |
| **Shisa Mask** | The Cursed Shisa and every newly frozen player | Once per game. If committed, it adds +2 to the played number, capped at 5. |

**Note on Survivor specials:** Each Survivor receives either a Bingata Shawl or a Hot Shikuwasa, assigned at random when the match starts. The design doc listed both cards under Survivors but gave each player one card, so this resolves the gap. Balance this after playtesting.

### Special-card timing

- A special card is optional and can be used once.
- Committing a special card spends it, whatever the outcome of the duel.
- The commit is hidden until both players lock in.
- The interface shows each special card as available, committed, or spent.

### Rules precedence

1. A committed Bingata Shawl blocks a Cold Breath, even when the attacker wins by a large margin.
2. Hot Shikuwasa only recovers a Shisa's Army member when its Survivor wins the duel.
3. Shisa Mask adds +2, capped at 5.
4. A tied duel changes no teams. Committed special cards are still spent.

### Losing a Survivor special on freeze

When a Survivor catches a cold, their unused Survivor special is removed. The player's private view shows a clear message, for example: "You caught a cold. Your Bingata Shawl is gone. You now have a Shisa Mask." The Shisa Mask is always fresh and unused.

### Future special cards (not in this build)

Do not build these for the jam:

- **Snow Globe** becomes Lantern Glow: protects a player from one encounter.
- **Snowball Cannon** becomes Typhoon Cannon: high-risk removal of a Shisa's Army member.
- **Sleigh Ride** becomes Fishing Boat Escape: avoids an encounter.
- **Coal** becomes Charcoal Brazier: forces an opponent to discard an unused number.
- **Christmas Miracle** becomes New Year's Miracle: recovers a player without a duel.

---

## 6. Round structure

### Round sequence

1. **Round announcement:** Show the round number and countdown.
2. **Pairing:** The server creates pairs. An odd player gets a Warm-Up. Each player sees their opponent.
3. **Secret selection:** Each player selects one unused card, may commit their special card, and locks in. The selection timer is 45 seconds. See `04-game-rules.md` for timeout behavior.
4. **Reveal:** When both players lock in, the numbers and special cards are revealed together.
5. **Resolution:** The server calculates effective strength, applies the matchup result and special-card effects, and changes teams.
6. **Round summary:** Show the duel result to both participants. Update the public team counts. Do not announce the identities of newly frozen players to the whole room.
7. **Next round:** Continue unless a win condition is met or round five has ended.

### Endgame

Show:

- Winning team
- Final Survivor and Shisa's Army counts
- The Cursed Shisa's identity
- Each player's transformation history
- Number cards each player used

Overview is the final screen of the match. Its Back to start button leaves the room. The player is then placed again, in an open lobby or a new room. The room closes when every player has left. If the optional village ships, the overview leads to the village first.

Awards are cut from the jam build.

---

## 7. Information and social deduction

The game encourages conversation without voice or text chat.

### Public information

All players can see:

- Player names and avatars
- Current round
- Public team counts (Survivors and Shisa's Army)
- Current pairings
- Their own numbered cards remaining
- Their own special card and its status
- Results of their own encounters

### Private information

Only the player and the server can see:

- Their own team
- Their own unused numbered cards
- Their own special card
- Their own encounter result before any public reveal

### Hidden information

- A newly frozen player's team change is not announced by default.
- Other players can guess or bluff about who caught a cold.
- The server always knows each player's real team. It never trusts a client's report.

### Party interaction

The game should prompt talk in the room:

- "I think you already caught a cold."
- "Save your five for the Shisa."
- "Help me and I'll recover you."
- "I'm still healthy. Don't waste your best card."

Text chat is not part of this build.

### Announcements and emotes

- **Round announcements:** At each round summary, a banner built from public team counts appears for everyone. For example: "2 players caught a cold this round." If nobody changed team, it says so. The banner never names a player.
- **Emotes:** Players may send one preset emote at a time from a short list. The list lives in `shared/constants.ts` and can grow after playtests. Free text is not part of this build.
- **Where emotes appear:** After the match, in the optional village. Emotes do not appear during rounds in this build. Emotes during rounds are a stretch goal, see `07-implementation-plan.md` section 5.

---

### Team progress bar (HUD)

A segmented bar sits at the top of the round screen and the result screen.

- **Segments:** One segment per player, so 8 players give 8 segments. Survivor segments and Shisa's Army segments differ in shape and text label, not only in color.
- **Win marker:** A marker shows that Shisa's Army wins outright at 100% infected. Survivors win by default if any Survivor remains after round five, so the bar must not imply a 50/50 contest.
- **Round ticks:** Five ticks, one per round, with the current round marked.
- **Caption:** A short line under the bar, for example "3 Survivors left. Shisa's Army needs all 8."
- **Timing:** The bar updates only when the round summary is shown, after every duel in the round has resolved. Team changes during a round stay hidden until then.
- **Data:** The bar uses only the public team counts. It adds no new information.
- **Accessibility:** The caption gives the same numbers as text, and the bar is not the only source.

## 8. Joining and the lobby

Nobody types a code, chooses a name, or presses ready. Opening the game page is all it takes.

### Automatic placement

1. A player opens the page. The app connects and asks the server to place them.
2. If the player has a saved seat in this tab (from a refresh), the server returns that seat.
3. Otherwise the server places them in the oldest lobby that is not full. If there is none, it starts a new room and makes them its first player.
4. The player gets an assigned name from a fixed list of eight, unique within the room. The list lives in `shared/constants.ts` as `PLAYER_NAMES`.
5. When the eighth player enters, the match starts at once. Any later player goes to a new room.

There is no host, no ready state, and no start button. The room's size is the only trigger.

### Lobby

- Shows the player's assigned name.
- Shows who is in the room and how many seats are left.
- Has a Leave room button. Leaving places the player again, in an open lobby or a new room.

Room codes stay internal. They are not shown on screen, and no QR code is used. The QR code and the join-by-code screen from version 1.4 are removed.

### Reconnection

Each player's seat is saved in `sessionStorage`, which is scoped to the browser tab. A refresh or brief disconnect returns the same seat. Two windows in one browser profile can each hold their own seat.

If the old socket still holds the seat during a refresh, the app retries for a short time before it gives up.
---

## 9. User experience and screens

The game is mobile-first. It must work in current iOS Safari and Android Chrome.

### Required screens

1. **Lobby:** Assigned name, player list, seats left, Leave room
2. **Round:** Round number, countdown, opponent, hand, lock-in, reveal
3. **Endgame overview:** Winner, history, Back to start
4. **Role reveal:** Private reveal of Cursed Shisa or Survivor, plus the special card and a short rules reminder
5. **Round:** Round number, countdown, opponent, own remaining numbered cards, special card control, Lock In button, waiting state
6. **Result:** Simultaneous reveal, winner and outcome, transformation message if applicable, Continue button
7. **Endgame overview:** Winning team, final results, transformation history, and a Back to start button.

### Mobile UI requirements

- Portrait layout first.
- Touch targets at least 44 CSS pixels.
- No hover-only interactions.
- Number cards are easy to tell apart and easy to tap.
- Team and card state never rely on color alone. Use text labels and icons.
- The player's hand stays at the bottom of the screen.
- Animations are short. Players never wait through long transitions.
- Waiting and connection states are always visible. The first connection may take up to about a minute while Render wakes the server. Show a "Server waking up" message with a spinner during that wait.
- No horizontal scrolling on small phones.

---

## 10. Technical architecture

See `02-tech-stack.md` for the full stack, including versions and rationale.

In short: React and Vite on Vercel for the client. Node, Express, and Socket.IO on Render for the authoritative server (see `02-tech-stack.md`). No database. Rooms live in server memory.

The server holds all game state. The client sends intentions, not results.

---

## 11. Socket events

See `08-socket-contract.md` for the complete event contract and payload types.

---

## 12. Project structure

Canonical structure and asset locations are in `09-project-structure.md`. Coding conventions are in `05-coding-standards.md`, and component layout is in `06-atomic-design.md`.

```text
okiwinter/
├── client/
│   ├── src/
│   │   ├── components/      (atoms, molecules, organisms)
│   │   ├── screens/
│   │   ├── socket/
│   │   ├── hooks/
│   │   ├── state/
│   │   └── App.tsx
│   └── vite.config.ts
├── server/
│   └── src/
│       ├── game/            (pure rules: Deck, Pairing, EncounterResolver, GameEngine)
│       ├── rooms/           (room registry, session tokens)
│       ├── socket/          (event handlers, validation)
│       └── index.ts
├── shared/
│   ├── types.ts
│   ├── events.ts
│   └── constants.ts
├── design/
├── package.json
└── README.md
```

---

## 13. Jam scope

The build has two weeks. The scope below is what must ship. The cut list in `07-implementation-plan.md` names what to drop first if the schedule slips.

### Must have

- Automatic placement into rooms, with assigned names
- 8 players per match, starting when the room is full
- Lobby with seats left
- Random Cursed Shisa assignment
- Survivor and Shisa's Army teams
- Five numbered cards per player
- Five rounds with random pairing, a rotating bye, and no repeated opponents in consecutive rounds
- Blind simultaneous card selection
- Higher-number duel resolution
- Team conversion (Catch a Cold)
- Bingata Shawl, Hot Shikuwasa, and Shisa Mask
- Private and public state separation
- Reconnect by session token
- Win conditions, results overview, and Back to start
- Round-summary announcement banner (no player names)
- Mobile browser layout
- Deployed to Vercel and Render, tested on two phones

### Optional (cut first if the schedule slips)

- Sound effects and one background music track, with a mute toggle
- Post-match village with preset emotes (see `07-implementation-plan.md` optional tasks)

### Not in this build

- Accounts, database, matchmaking
- Chat (voice or text)
- Player-selected opponents
- Random round events
- Additional special cards
- Rematch, awards, and kick-from-lobby
- Native apps
- Custom art beyond simple placeholder shapes and SVG
- Emotes during rounds (stretch goal)

---

## 14. Balancing and playtesting

Track these outcomes during playtests:

- Average match duration
- Percentage of matches won by Shisa's Army
- Average round when the first Survivor catches a cold
- How often players tie
- Whether players have meaningful choices late in the match
- Whether Hot Shikuwasa is strong enough to justify saving it

### Open questions for playtesting

These are tuning decisions, not blockers:

1. Is five rounds the right length, or should it be four or six?
2. Does Shisa's Army grow too fast with 4 players, or too slowly with 8?
3. Should a newly frozen player get a fresh Shisa Mask, or should the mask be shared across the team?
4. Is Hot Shikuwasa too hard to use if the Survivor must first win a duel?
5. Should the final round reveal all team identities for drama?
6. With the current win rules, Survivors may win most matches by default. Does the progress bar change how players feel about this?
7. Does the bar make late-game results feel decided too early?
8. Random pairing means many duels are between teammates. Count how many duels in playtests have no team effect, and decide whether that is acceptable.

---

## 15. Definition of done

The build is ready for the jam when:

- A host can create a room from the public URL.
- 4 to 8 people can join on their phones without installing anything.
- The host can start a match.
- Each player privately sees their role, cards, and special card.
- Players can commit blind card choices.
- No opponent's choice is revealed early.
- The server resolves every encounter and team change correctly.
- A lost special card is always clearly shown to the affected player.
- A disconnected player keeps their seat.
- The match ends with a clear winning team.
- The full flow has been tested on the deployed URL with at least two real phones.

---

## Changelog

- **1.1:** Retheme from Christmas to Okinawa winter (Shisa Revenge). Applied the approved terminology table. Resolved the Survivor special gap, the special-card commit timing, the bye rotation rule, and the lost-special notification. Cut scope to a two-week jam build.
- **1.2:** Added the team progress bar HUD. Public counts update only at round summary, not during duels.
- **1.3:** Node stays as the server stack. Endgame becomes an overview followed by Back to start, with no rematch. Pairing stays random, with no repeated opponents in consecutive rounds. Added round-summary announcements and preset emotes. Shisa's Army members do not learn their teammates. Player-chosen pairing is parked for after the jam.
- **1.4:** Render is the server host, with a spin-up message while it wakes. Emotes during rounds moved to the stretch goal.
- **1.5:** Automatic room placement replaces the landing, join, and ready steps. Names are assigned from a list of eight. A room starts when it has eight players. The QR code is removed. Seats are saved per tab.
