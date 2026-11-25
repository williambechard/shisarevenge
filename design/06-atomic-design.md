# 06. Atomic Design and Architecture

**Status:** Locked for the jam build. Applies to the React client. The server follows the module layout in section 5.

Atomic design organizes UI into five levels: atoms, molecules, organisms, templates, and screens. For a 2-week build, keep the levels, but keep the number of components small.

## 1. Levels

| Level | Purpose | Rules |
|---|---|---|
| **Atoms** | Smallest UI pieces with no game knowledge | Pure. Props only. No socket or state access. |
| **Molecules** | Small groups of atoms that form one useful unit | Pure or with local UI state only. No socket access. |
| **Organisms** | Larger game sections that show real game state | Receive data as props. May contain molecules and atoms. |
| **Templates** | Page layouts with slots | No game data. Only layout. |
| **Screens** | One per app state, connects data to organisms | The only level that reads game state from the store. |

Data flows down. Events flow up through callbacks. Only screens and hooks talk to the socket.

## 2. Folder layout

The full tree, including asset folders, is in `09-project-structure.md`. The client tree below shows the component layout only.

```text
client/src/
├── components/
│   ├── atoms/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Icon.tsx
│   │   └── Countdown.tsx
│   ├── molecules/
│   │   ├── NumberCard.tsx
│   │   ├── SpecialCard.tsx
│   │   ├── PlayerChip.tsx
│   │   ├── RoomCode.tsx
│   │   ├── TeamCount.tsx
│   │   ├── TeamBar.tsx
│   │   ├── StatusMessage.tsx
│   │   ├── EmoteBar.tsx
│   │   └── Announcement.tsx
│   ├── organisms/
│   │   ├── LobbyPanel.tsx
│   │   ├── PlayerList.tsx
│   │   ├── HandTray.tsx
│   │   ├── EncounterPanel.tsx
│   │   ├── RevealPanel.tsx
│   │   ├── RoleCard.tsx
│   │   └── EndgameSummary.tsx
│   └── templates/
│       └── PhoneFrame.tsx
├── screens/
│   ├── LandingScreen.tsx
│   ├── JoinScreen.tsx
│   ├── LobbyScreen.tsx
│   ├── RoleRevealScreen.tsx
│   ├── RoundScreen.tsx
│   ├── ResultScreen.tsx
│   └── EndgameScreen.tsx
├── socket/
│   ├── socketClient.ts      (single connection, reconnect config)
│   └── eventHandlers.ts     (server events to reducer actions)
├── state/
│   ├── gameReducer.ts
│   ├── gameState.ts         (types)
│   └── session.ts           (localStorage token helpers)
├── hooks/
│   ├── useGame.ts           (exposes state and actions to screens)
│   └── useCountdown.ts
└── App.tsx                  (chooses the screen from state)
```

## 3. Component catalog

### Atoms

| Component | Purpose | Key props |
|---|---|---|
| `Button` | Primary and secondary actions. Minimum 44px. | `variant`, `disabled`, `onClick`, `children` |
| `Badge` | Short label with text and icon | `tone`, `label`, `icon` |
| `Avatar` | Player avatar with team overlay | `name`, `team`, `size` |
| `Icon` | Wraps a Lucide icon with an accessible label | `name`, `label` |
| `Countdown` | Shows seconds left, announces at 10 and 0 | `secondsLeft` |

### Molecules

| Component | Purpose | Key props |
|---|---|---|
| `NumberCard` | One numbered card. Shows value and name. Can be disabled or selected. | `value`, `name`, `state` (`available`, `selected`, `used`), `onSelect` |
| `SpecialCard` | Special card with status | `kind`, `status`, `onToggle` |
| `PlayerChip` | Name, avatar, and team badge in a compact row | `player`, `isSelf` |
| `RoomCode` | Room code with copy button | `code` |
| `TeamCount` | Survivor and Shisa's Army counts | `survivors`, `infected` |
| `TeamBar` | Segmented progress bar: one segment per player, 100% win marker, five round ticks, text caption | `survivors`, `infected`, `round`, `roundCount` |
| `StatusMessage` | Live status text, for example "Waiting for opponent" | `message`, `tone` |
| `EmoteBar` | Row of preset emote buttons, with cooldown state | `emotes`, `onSend`, `cooldownMs` |
| `Announcement` | Banner for round-summary messages, read aloud by screen readers | `text`, `round` |

### Organisms

| Component | Purpose | Shows |
|---|---|---|
| `LobbyPanel` | Room code, QR, player list, ready toggle, host start | Room state |
| `PlayerList` | List of `PlayerChip` | Players in the room |
| `HandTray` | Bottom tray with the player's five `NumberCard`s and `SpecialCard` | Private hand |
| `EncounterPanel` | Opponent, round number, countdown, lock-in button | Current encounter |
| `RevealPanel` | Both numbers, specials, and outcome | Reveal payload |
| `RoleCard` | Private role reveal with special card and rules | Private role |
| `EndgameSummary` | Winner, counts, Shisa's identity, history | Final result |

### Templates

- `PhoneFrame`: a portrait container with safe-area padding and a sticky bottom slot. Every screen uses it.

### Screens

Each screen takes its data from `useGame()` and renders organisms in the right order.

- `LandingScreen`, `JoinScreen`: no game state.
- `LobbyScreen`: `LobbyPanel`, `PlayerList`.
- `RoleRevealScreen`: `RoleCard`.
- `RoundScreen`: `TeamBar`, `Announcement`, `EncounterPanel`, `HandTray`, `StatusMessage`. Shows the lost-special message when it exists.
- `ResultScreen`: `RevealPanel`, then the next-round control.
- `EndgameScreen`: `EndgameSummary`, Back to start control, and `EmoteBar` when the optional village is built.

## 4. State model

The server sends a full public snapshot on each change, plus a private snapshot to each player. The client reducer keeps:

```ts
type GameState = {
  connection: 'connecting' | 'waking' | 'connected' | 'reconnecting' | 'offline';
  room: PublicRoomState | null;
  self: PrivatePlayerState | null;
  messages: StatusNotice[];   // for lost specials, auto-lock, errors
};
```

- `PublicRoomState` comes from `room:state`.
- `PrivatePlayerState` comes from `player:private-state`.
- The reducer applies server events. It never decides outcomes.

## 5. Server module layout

```text
server/src/
├── game/
│   ├── constants.ts        (re-exports from shared)
│   ├── deck.ts             (initial hands and specials)
│   ├── pairing.ts          (pairing and warm-up rotation)
│   ├── encounterResolver.ts
│   ├── teamChanges.ts      (catchCold, recover)
│   ├── winConditions.ts
│   ├── gameEngine.ts       (ties the above together, phase transitions)
│   └── *.test.ts
├── rooms/
│   ├── roomRegistry.ts     (create, find, expire)
│   ├── roomCode.ts
│   └── sessionTokens.ts
├── socket/
│   ├── registerHandlers.ts
│   ├── validate.ts         (Zod wrapper)
│   ├── rateLimit.ts
│   └── broadcast.ts        (public and private emitters)
├── http/
│   └── health.ts
└── index.ts
```

`gameEngine.ts` is the only place that combines rules. Handlers call it and emit the results. No handler contains rule logic.

## 6. Shared module

```text
shared/
├── types.ts       (Team, SpecialKind, SpecialStatus, CardValue, public and private state types)
├── events.ts      (Zod schemas and event name constants)
└── constants.ts   (MIN_PLAYERS, MAX_PLAYERS, ROUND_COUNT, timers, card values)
```

`shared/` holds data shapes, schemas, and constants only. It has no game logic, so the client cannot compute outcomes from it.

## 7. Naming across layers

Follow the naming table in `05-coding-standards.md`. Components use theme names in their text only. For example, a `TeamCount` component shows "Shisa's Army" but its props say `infected`.

## 8. Accessibility and layout rules

- Each screen has one `h1` that names the screen.
- Interactive elements are `Button` or real links. No clickable `div`s.
- Only `HandTray` and `RoundScreen` change on each phase. Other screens stay stable so players do not lose their place.

## 9. Build order for components

Build from the bottom up, in this order, so every level can be tested as it is built:

1. Atoms: `Button`, `Badge`, `Avatar`, `Icon`, `Countdown`.
2. Molecules: `NumberCard`, `SpecialCard`, `PlayerChip`, `RoomCode`, `TeamCount`, `TeamBar`, `StatusMessage`, `EmoteBar`, `Announcement`.
3. Organisms: `PlayerList`, `LobbyPanel`, `HandTray`, `EncounterPanel`, `RevealPanel`, `RoleCard`, `EndgameSummary`.
4. Template: `PhoneFrame`.
5. Screens, connected last.

Each organism gets a Storybook-free preview: a small dev-only route at `/dev/components` that renders each piece with fixture data. This is the cheapest way to check layout on a phone before the server works. Remove the route before the party or keep it behind `import.meta.env.DEV`.
