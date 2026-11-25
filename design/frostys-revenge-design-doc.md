# Frosty's Revenge

## Game Design Document (GDD)

**Version:** 1.0\
**Status:** Core concept and MVP rules defined\
**Target platform:** Mobile-friendly web game\
**Players:** 4--8\
**Session length:** Approximately 10--15 minutes\
**Genre:** Social deduction, hidden information, push-your-luck card
duels

------------------------------------------------------------------------

## 1. High concept

**Frosty's Revenge** is a Christmas-themed multiplayer card game
inspired by the blind numbered-card duels and spreading-infection
tension of the zombie game in *Alice in Borderland*.

Frosty has gone rogue. His enchanted hat is spreading an icy curse
through a group of Christmas survivors. One player begins as Frosty;
anyone he freezes joins his snowman army and can help spread the curse.

Each encounter is resolved through a simultaneous, blind choice of
numbered cards. Players must decide when to spend their strongest cards,
when to save them, and whom they can trust.

The game is designed for a group sitting together at a party. Each
participant joins the same game room from their own phone using a URL
and room code. No app installation or account is required.

### Design pillars

1.  **Blind decisions:** Players commit to a number before seeing their
    opponent's choice.
2.  **Changing teams:** A frozen player switches sides rather than
    leaving the game.
3.  **Resource tension:** Number cards are limited and cannot be reused
    during a match.
4.  **Social uncertainty:** Players can discuss, bluff, bargain, and
    mislead one another.
5.  **Fast party pacing:** Short rounds, simple rules, and no player
    elimination.

------------------------------------------------------------------------

## 2. Theme and world

### Premise

It's Christmas Eve. Frosty's enchanted top hat has been corrupted by an
ancient winter spell. Frosty is turning everyone he touches into
snowmen, building an army to take over the North Pole before Christmas
morning.

The survivors have a limited supply of useful items: warm clothing, hot
cocoa, and a few other Christmas miracles. They must survive until the
countdown ends---or thaw Frosty's growing army before it is too late.

### Tone and visual direction

-   **Tone:** Playful Christmas horror. Mischievous and spooky, never
    graphic.
-   **Visual style:** Colorful illustrated storybook art, expressive
    snowmen, cozy Christmas details, and dramatic icy effects.
-   **Palette:** Snow white, icy blue, midnight navy, cranberry red,
    evergreen, and warm gold.
-   **Frosty:** A recognizable, imposing snowman with a black top hat,
    carrot nose, coal details, red scarf, and glowing icy-blue eyes.
-   **Transformation:** A player's avatar gradually frosts over, gains
    snowman features, and changes team color.
-   **Interface:** Large readable cards and buttons designed for
    one-handed phone use.

### Terminology

  Game concept              In-game term
  ------------------------- -------------------------
  Initial infected player   Frosty
  Infected team             Snowmen / Frosty's Army
  Uninfected team           Survivors
  Infection                 Freeze
  Cure                      Thaw
  Quarantine                Snowed In
  Infection attack          Frosty's Touch
  Vaccine / healing item    Hot Cocoa
  Protective item           Thermal Jacket
  Match timer               Countdown to Christmas

------------------------------------------------------------------------

## 3. Players, roles, and objective

### Player count

-   Minimum: 4
-   Recommended: 5--6
-   Maximum: 8

### Starting teams

-   One player is randomly selected as **Frosty**.
-   All other players begin as **Survivors**.
-   Frosty is publicly identified as the initial snowman. The identities
    of subsequently frozen players are private to the affected player
    unless revealed through play or discussion.
-   When a Survivor is frozen, they immediately join Frosty's Army.

The game does not eliminate players. Frozen players continue taking part
and can help their team.

### Win conditions

The game lasts **five rounds**.

-   **Frosty's Army wins immediately** if every player is a Snowman.
-   **Survivors win** if at least one Survivor remains when round five
    ends.
-   If Frosty is thawed, Frosty's Army still exists if other Snowmen
    remain. If all Snowmen are thawed, the Survivors win immediately.

This creates a clear, easy-to-understand team objective: spread the
freeze before time runs out.

------------------------------------------------------------------------

## 4. Core numbered-card mechanic

This is the central mechanic and should remain the heart of the game.

### Number cards

Every player starts with the same five numbered cards:

  Card          Strength Name
  ----------- ---------- -----------
  Snowflake            1 Snowflake
  Snowball             2 Snowball
  Icicle               3 Icicle
  Blizzard             4 Blizzard
  Frostbite            5 Frostbite

Each numbered card can be used **once per game**. Played cards are
discarded and cannot be recovered during the match.

### Encounter resolution

Each round, the server pairs players into encounters. Each player in an
encounter:

1.  Sees their opponent.
2.  Secretly selects one unused numbered card.
3.  Locks in their choice.
4.  Waits until both players have committed.
5.  Sees both cards revealed simultaneously.

The higher number wins the duel.

**The server must not reveal either choice until both players have
locked in.** The server is authoritative and resolves every duel.

### What winning means

  -----------------------------------------------------------------------
  Matchup                             Result
  ----------------------------------- -----------------------------------
  Snowman beats Survivor              Survivor is frozen and joins
                                      Frosty's Army

  Survivor beats Snowman              Survivor repels the attack; both
                                      remain on their current teams

  Survivor ties Snowman               The attack fails; neither player
                                      changes teams

  Survivor vs. Survivor               No team change; the higher card
                                      wins the encounter

  Snowman vs. Snowman                 No team change; the higher card
                                      wins the encounter
  -----------------------------------------------------------------------

For all matchups, a tie is a draw and neither player changes teams. A
tie does not cause a freeze.

The duel is still useful when no infection is possible: it reveals
card-use patterns, consumes valuable numbers, and creates uncertainty
about what opponents have left.

### Card exhaustion

-   A player may only select a numbered card they still have.
-   Used cards remain visible in that player's personal discard area.
-   Opponents do not see a player's remaining hand or discard pile
    unless a game effect explicitly reveals it.
-   If a player has no numbered cards remaining, they cannot participate
    in a normal numbered-card duel. They still participate in discussion
    and can use any remaining special effect that does not require a
    number.
-   The five-round match length means a player can use their full
    numbered hand if they participate in every round.

### Pairing and odd player counts

To keep the MVP straightforward and fair:

-   The server randomly pairs all active players at the beginning of
    each round.
-   With an odd number of players, one player receives a **Warm-Up**
    (bye) and does not enter a duel that round.
-   The bye rotates so players do not repeatedly sit out.
-   Players cannot choose their opponent in the MVP. This avoids
    targeting disputes and makes round resolution predictable.
-   Pairings are visible before card selection begins.

A later version may add player-selected challenges or a target-selection
phase, but that is not part of the initial build.

------------------------------------------------------------------------

## 5. Special cards and abilities

Special cards add Christmas flavor and tactical exceptions without
replacing the numbered-card system.

### MVP special cards

Each player receives one special card at the start of the game. The
server assigns cards according to team:

  -----------------------------------------------------------------------
  Card                    Assigned to             Effect
  ----------------------- ----------------------- -----------------------
  **Thermal Jacket**      Survivors               Once per game,
                                                  automatically blocks
                                                  one incoming freeze.
                                                  The numbered duel still
                                                  occurs and both number
                                                  cards are spent.

  **Hot Cocoa**           Survivors               Once per game, if you
                                                  win a duel against a
                                                  Snowman, you may choose
                                                  to thaw that opponent
                                                  instead of merely
                                                  repelling them.

  **Frosty's Magic Hat**  Frosty and newly frozen Once per game, add +2
                          Snowmen                 to the Snowman's played
                                                  number, to a maximum
                                                  effective strength of
                                                  5. Declare it with the
                                                  number-card selection;
                                                  it is revealed with the
                                                  cards.
  -----------------------------------------------------------------------

A player receives the special card associated with their current team.
When a Survivor becomes a Snowman, their unused Survivor special is
replaced by Frosty's Magic Hat. If their Survivor special was already
used, they still receive the Snowman special, but it is marked as used
only if the game design setting says so. **MVP rule: the new Snowman
receives a fresh, unused Magic Hat.**

### Special-card timing

-   A special card is optional and can be used only once.
-   It is committed at the same time as the numbered card.
-   Its use is hidden until both players have locked in.
-   The server resolves the numbered values and special effects
    together.
-   The interface must clearly show whether a special card is available,
    committed, or spent.

### Rules precedence

1.  A Thermal Jacket blocks a freeze, even if the Snowman wins by a
    large margin.
2.  Hot Cocoa can only thaw a Snowman if its Survivor wins the duel and
    chooses to spend the card.
3.  Frosty's Magic Hat adds +2, capped at 5.
4.  If a duel is tied, no freeze or thaw occurs. A committed special
    card is still spent.

### Future special cards (not MVP)

These can be added after playtesting:

-   **Snow Globe:** Protects a player from one encounter.
-   **Snowball Cannon:** A high-risk card that can remove a Snowman from
    the board temporarily.
-   **Sleigh Ride:** Avoids an encounter or grants a one-round escape.
-   **Coal:** Forces an opponent to discard a chosen unused number.
-   **Christmas Miracle:** Thaws a player without requiring a duel win.

Do not implement these until the core game is balanced.

------------------------------------------------------------------------

## 6. Round structure

The match consists of five rounds, followed by the endgame.

### Round sequence

1.  **Round announcement**
    -   Show the round number and countdown.
    -   Reveal the round's optional event only if events are enabled.
        Events are disabled in the first MVP playtest.
2.  **Pairing**
    -   Server creates random pairs.
    -   An odd player receives a Warm-Up.
    -   Show each player's opponent.
3.  **Secret selection**
    -   Each player selects one unused numbered card.
    -   They may optionally commit their available special card.
    -   Selection is locked when submitted.
    -   Players who have locked in wait for their opponent.
4.  **Reveal**
    -   When both players have locked in, reveal the numbered cards and
        any special cards simultaneously.
5.  **Resolution**
    -   Server calculates effective strength.
    -   Server applies the matchup result and special-card effects.
    -   Any newly frozen players switch teams.
    -   Any thawed players switch back to Survivors.
6.  **Round summary**
    -   Show the duel result to both participants.
    -   Update the public team count.
    -   Do not automatically reveal the identity of newly frozen players
        to the entire lobby.
7.  **Next round**
    -   Begin the next round unless a win condition has been reached or
        five rounds have completed.

### Endgame

Display: - Winning team - Final Survivor and Snowman counts - Frosty's
identity - Player-by-player transformation history - Number cards each
player used - Optional playful awards (e.g. "The Ice-Cold Strategist,"
"Most Festive Betrayal," "Last One Standing")

------------------------------------------------------------------------

## 7. Information and social deduction

The game should create conversation without requiring voice chat or text
chat.

### Public information

All players can see: - Player names and avatars - Current round - Public
team totals (number of Survivors and Snowmen) - Current pairings - Their
own numbered cards remaining - Their own special card and its status -
Results of their own encounters

### Private information

Only the player and server can see: - Their own team - Their own unused
number cards - Their own special card - Their own encounter result
before any optional public reveal

### Hidden information

-   A newly frozen player's team change is not announced publicly by
    default.
-   Other players can infer or bluff about who has been frozen.
-   The server always knows each player's actual team and never trusts a
    client to report it.

**Important implementation decision:** The game can hide team changes in
the interface, but the actual rules must still be consistent. A player
who has been frozen sees their own Snowman status and can use Snowman
actions. Other players see only the public information the game chooses
to reveal.

### Party interaction

The game should encourage players to talk in person: - "I think you're
already frozen." - "Save your five for Frosty." - "I can thaw you if you
help me." - "I'm still human---don't waste your best card."

In-game chat is not required for the MVP.

------------------------------------------------------------------------

## 8. Match setup and lobby

### Join flow

1.  Host opens the game URL.
2.  Host selects **Create Game**.
3.  Server creates a room and returns a short room code.
4.  Host displays the room code and QR code.
5.  Participants open the URL on their phones and enter the code.
6.  Participants enter a display name and join the lobby.
7.  Host starts the match when 4--8 players are ready.

No accounts, passwords, downloads, or app-store installation are
required.

### Lobby features

-   Room code prominently displayed
-   QR code linking to the game URL with the room code embedded
-   Player list with ready indicators
-   Host-only Start Game button
-   Minimum/maximum player validation
-   Host can remove a disconnected or inappropriate lobby participant
-   Lobby automatically closes after the match ends or the room expires

### Reconnection

Each participant receives a secure session token stored on their device
for the life of the room. If they refresh or temporarily disconnect,
they can rejoin the same player slot.

The server must not create a duplicate player when a known session
reconnects.

------------------------------------------------------------------------

## 9. User experience and screens

The game is mobile-first and should work in current iOS and Android
browsers.

### Required screens

1.  **Landing screen**
    -   Game title and theme art
    -   Create Game
    -   Join Game
2.  **Join screen**
    -   Room code
    -   Display name
    -   Join button
3.  **Lobby**
    -   Room code and QR code
    -   Player list
    -   Ready state
    -   Host controls
4.  **Role reveal**
    -   Private reveal of Frosty or Survivor
    -   Show the player's special card
    -   Brief rules reminder
5.  **Round screen**
    -   Round number and countdown
    -   Opponent card/avatar
    -   Player's own remaining numbered cards
    -   Special card control
    -   Lock In button
    -   Waiting state after submission
6.  **Result screen**
    -   Simultaneous card reveal
    -   Winner and outcome
    -   Transformation animation if applicable
    -   Continue button or automatic next round
7.  **Endgame screen**
    -   Winning team
    -   Final results
    -   Play Again / Return to Lobby

### Mobile UI requirements

-   Portrait layout first.
-   Large touch targets (minimum approximately 44 CSS pixels).
-   No hover-only interactions.
-   Number cards must be easy to distinguish and tap.
-   Never rely on color alone to communicate team or card state.
-   Keep the current player's hand at the bottom of the screen.
-   Use short animations; never make players wait through long
    transitions.
-   Provide visible waiting and connection states.
-   Support small phone screens without horizontal scrolling.

------------------------------------------------------------------------

## 10. Technical architecture

### Selected stack

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React                   Mobile web interface

  Language                TypeScript              Shared types and safer
                                                  game logic

  Build tool              Vite                    Fast development and
                                                  static production build

  Styling                 Tailwind CSS            Responsive mobile-first
                                                  UI

  Icons                   Lucide                  Consistent interface
                                                  icons

  Realtime multiplayer    Socket.IO               Rooms, player events,
                                                  live updates

  Backend                 Node.js + Express       Authoritative game
                                                  server and HTTP health
                                                  endpoint

  Hosting: frontend       Vercel                  Public game URL and
                                                  static assets

  Hosting: backend        Render                  Persistent Node.js /
                                                  Socket.IO service

  Source control          GitHub                  Repository and
                                                  automatic deployments

  Database                None for MVP            Rooms and game state
                                                  live in server memory
  -----------------------------------------------------------------------

### Hosting and player access

**Recommended deployment:**

-   Frontend: Vercel, for example `https://frostys-revenge.vercel.app`
-   Backend: Render, for example
    `https://frostys-revenge-server.onrender.com`
-   Players visit the Vercel URL on their phones.
-   The frontend connects to the Render server over HTTPS and secure
    WebSockets.
-   The host creates a room; everyone else joins with the room code or
    QR code.

A custom domain can be added later but is not required.

### Why this architecture

-   The game is turn-based and card-driven, so it does not need a
    heavyweight game engine.
-   React is well suited to cards, lobbies, player lists, and mobile
    screens.
-   Socket.IO handles real-time room updates and reconnects.
-   The server can validate every action and keep hidden information
    private.
-   Vercel is suitable for the static frontend. The persistent Socket.IO
    server should run as a normal Node service rather than a serverless
    function.
-   Render provides a straightforward place to run that Node service.

**Reliability note:** Free hosting tiers can sleep or have resource
limits. For a scheduled party, test the complete game on the actual
deployment beforehand. Use an always-on backend plan for the event if
the free service's sleep/wake behavior could interrupt play.

### Server authority and anti-cheat

The server is the source of truth for: - Room membership - Player
identity and reconnect tokens - Roles and teams - Number cards
remaining - Special cards and usage - Pairings - Submitted selections -
Duel resolution - Round and win conditions

The client sends intentions, not results. For example, it sends "play
card 4 and commit Thermal Jacket," never "I won the duel."

The server must: - Validate that a card belongs to the player and is
unused. - Accept only one selection per player per encounter. - Keep
selections secret until both players have locked in. - Resolve all
effects in a deterministic order. - Send each client only the public
state and that player's private state. - Reject actions from players who
are not part of the room or not eligible to act.

------------------------------------------------------------------------

## 11. Socket.IO events

Suggested event contract:

### Client → server

  Event                Purpose
  -------------------- --------------------------------------------
  `room:create`        Create a room
  `room:join`          Join using room code and display name
  `room:leave`         Leave a room
  `lobby:ready`        Set ready state
  `game:start`         Host starts the match
  `encounter:submit`   Submit numbered card and optional special
  `game:next-round`    Request/acknowledge next round if required
  `game:rematch`       Host requests a rematch

### Server → client

  Event                    Purpose
  ------------------------ ---------------------------------------------
  `room:created`           Return room code and player session
  `room:joined`            Confirm join
  `room:state`             Public lobby/game state
  `player:private-state`   Send only the recipient's private state
  `game:started`           Begin role reveal
  `round:paired`           Send encounter opponent
  `encounter:waiting`      Confirm selection is locked
  `encounter:revealed`     Reveal both cards to encounter participants
  `encounter:result`       Send resolved outcome
  `round:ended`            Announce round summary
  `game:ended`             Announce winner and final results
  `error`                  Return a safe, user-readable error
  `player:reconnected`     Announce reconnection

Event names can be adjusted during implementation, but the separation
between public state and private player state must remain.

------------------------------------------------------------------------

## 12. Project structure

A small TypeScript monorepo keeps the frontend, server, and shared
contracts together.

``` text
frostys-revenge/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NumberCard/
│   │   │   ├── SpecialCard/
│   │   │   ├── PlayerAvatar/
│   │   │   ├── Lobby/
│   │   │   └── Encounter/
│   │   ├── screens/
│   │   │   ├── LandingScreen.tsx
│   │   │   ├── JoinScreen.tsx
│   │   │   ├── LobbyScreen.tsx
│   │   │   ├── GameScreen.tsx
│   │   │   └── ResultsScreen.tsx
│   │   ├── socket/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── vite.config.ts
├── server/
│   └── src/
│       ├── game/
│       │   ├── GameEngine.ts
│       │   ├── GameManager.ts
│       │   ├── EncounterResolver.ts
│       │   ├── Deck.ts
│       │   └── Pairing.ts
│       ├── rooms/
│       ├── socket/
│       └── index.ts
├── shared/
│   ├── types.ts
│   ├── events.ts
│   └── constants.ts
├── package.json
└── README.md
```

------------------------------------------------------------------------

## 13. MVP scope

The first playable release should be deliberately small.

### Must have

-   Create and join rooms with a room code.
-   QR code join support.
-   4--8 players.
-   Lobby and ready states.
-   Random Frosty assignment.
-   Survivor and Snowman teams.
-   Five numbered cards per player.
-   Five rounds with random pairings and rotating bye.
-   Blind simultaneous card selection.
-   Higher-number duel resolution.
-   Freeze and team conversion.
-   Thermal Jacket, Hot Cocoa, and Frosty's Magic Hat.
-   Private and public state separation.
-   Reconnect support.
-   Win conditions and results screen.
-   Mobile browser layout.

### Not in MVP

-   Player accounts
-   Persistent database
-   Public matchmaking
-   Voice or text chat
-   Player-selected opponents
-   Multiple maps or locations
-   Complex inventory or trading
-   Random round events
-   Additional special cards
-   In-game purchases
-   Native iOS or Android apps

------------------------------------------------------------------------

## 14. Development milestones

### Milestone 1 --- Multiplayer foundation

-   Create React/Vite client and Node/Socket.IO server.
-   Connect clients to server.
-   Create and join rooms.
-   Display lobby and player list.
-   Add reconnect handling.

**Acceptance test:** Four phones can join one room and see the same
lobby state.

### Milestone 2 --- Core card duel

-   Add player pairing.
-   Add numbered-card hands.
-   Add hidden selection and lock-in.
-   Reveal only after both players submit.
-   Resolve higher number and ties.
-   Consume played cards.

**Acceptance test:** Two clients can play a blind duel; neither sees the
other's selection before both lock in.

### Milestone 3 --- Teams and infection

-   Assign Frosty.
-   Implement freeze conversion.
-   Implement Survivor and Snowman rules.
-   Add round progression and win conditions.

**Acceptance test:** A Snowman can freeze a Survivor by winning a duel;
the converted player can continue playing on the Snowman team.

### Milestone 4 --- Special cards

-   Add Thermal Jacket.
-   Add Hot Cocoa and thawing.
-   Add Frosty's Magic Hat.
-   Add special-card state and timing.

**Acceptance test:** Special effects resolve correctly, once per game,
without exposing hidden choices.

### Milestone 5 --- Presentation and party readiness

-   Add Christmas art and animations.
-   Add QR code and polished lobby.
-   Add results and rematch.
-   Test on iOS Safari and Android Chrome.
-   Test deployed backend reliability and reconnection.

**Acceptance test:** A group of 4--8 people can join, finish a full
match, and start another without developer intervention.

------------------------------------------------------------------------

## 15. Balancing and playtesting

The first version is a prototype. Track these outcomes during playtests:

-   Average match duration
-   Percentage of matches won by Frosty's Army
-   Average round in which the first Survivor freezes
-   How often players tie
-   How often players run out of useful number cards
-   Whether players feel they have meaningful choices late in the match
-   Whether Hot Cocoa is powerful enough to justify saving it

### Initial balance assumptions

-   Five numbered cards per player, each used once.
-   Five rounds.
-   One initial Snowman.
-   Random pairings.
-   Higher number wins.
-   Snowman victory against a Survivor causes a freeze.
-   A Survivor victory against a Snowman prevents the freeze.
-   Ties cause no team change.
-   A thawed player returns to the Survivor team.

Do not add more cards or random events until these assumptions have been
playtested.

------------------------------------------------------------------------

## 16. Open questions for playtesting (not blockers for the MVP)

These are tuning decisions, not unresolved architecture:

1.  Is five rounds the right length, or should the game use four or six?
2.  Does Frosty's Army grow too quickly with 4 players or too slowly
    with 8?
3.  Should a newly converted Snowman receive a fresh Magic Hat, as
    specified for MVP, or should the ability be shared across the team?
4.  Is Hot Cocoa too difficult to use if a Survivor must first win a
    duel against a Snowman?
5.  Should the final round reveal all team identities to create a
    dramatic finale?

------------------------------------------------------------------------

## 17. Definition of done

The MVP is ready for a Christmas party when:

-   A host can create a room from a public URL.
-   4--8 participants can join on their phones without installing
    anything.
-   The host can start a match.
-   Every player can privately see their role, cards, and special
    ability.
-   Players can commit blind numbered-card choices.
-   No opponent's choice is revealed early.
-   The server resolves all encounters and team changes correctly.
-   Disconnections do not permanently lose a player's seat.
-   The match ends with a clear winning team.
-   The complete flow has been tested on the deployed URL using multiple
    real phones.

**Final product direction:** Frosty's Revenge is a fast, mobile-first
Christmas party game built around blind numbered-card duels, limited
card resources, and a snowman outbreak that changes the teams as the
match unfolds.
