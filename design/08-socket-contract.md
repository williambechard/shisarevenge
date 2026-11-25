# 08. Socket.IO Event Contract

**Status:** Locked for the jam build. Every event below has a Zod schema in `shared/events.ts`. Payload types are inferred from those schemas.

## 1. Rules for this contract

- The client sends intentions. The server sends state.
- Public events go to the whole room. Private events go to one socket.
- Every client-to-server event returns an acknowledgement with `{ ok: true, ... }` or `{ ok: false, error: { code, message } }`.
- Error messages are short and safe. They never include other players' data, tokens, or hidden selections.
- Event names use `domain:action` in kebab case.

## 2. Shared types

```ts
type CardValue = 1 | 2 | 3 | 4 | 5;
type Team = 'survivor' | 'infected';
type SpecialKind = 'bingata-shawl' | 'hot-shikuwasa' | 'shisa-mask';
type SpecialStatus = 'available' | 'committed' | 'spent' | 'lost';
type Phase = 'lobby' | 'announce' | 'pairing' | 'selecting' | 'revealed' | 'resolved' | 'ended';

type PublicPlayer = {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
};

type PublicRoomState = {
  roomCode: string;
  phase: Phase;
  round: number;
  roundCount: 5;
  players: PublicPlayer[];
  pairings: Array<{ a: string; b: string }>;
  warmUpPlayerId: string | null;
  teamCounts: { survivors: number; infected: number }; // values from the last round summary, never mid-round
  secondsLeft: number | null;
  winner: Team | null;
  originPlayerId: string | null; // set after the game starts
  endgame: EndgameSummary | null;
};

type PrivatePlayerState = {
  playerId: string;
  team: Team;
  hand: CardValue[];                 // unused cards only
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  encounter: {
    opponentId: string;
    selectionLocked: boolean;
    lastResult: DuelOutcome | null;
  } | null;
  notices: PrivateNotice[];
};

type DuelOutcome = {
  round: number;
  opponentId: string;
  myValue: CardValue;
  opponentValue: CardValue;
  mySpecial: SpecialKind | null;
  opponentSpecial: SpecialKind | null;
  result: 'won' | 'lost' | 'tie' | 'blocked' | 'repelled' | 'recovered';
};

type PrivateNotice =
  | { kind: 'caught-cold'; lostSpecial: SpecialKind | null; newSpecial: 'shisa-mask' }
  | { kind: 'recovered'; lostSpecial: 'shisa-mask' | null; newSpecial: SpecialKind }
  | { kind: 'auto-locked' };

type EndgameSummary = {
  winner: Team;
  survivors: number;
  infected: number;
  originPlayerId: string;
  history: Array<{ playerId: string; transformations: number[] }>;
};
```

Notes:

- `PrivatePlayerState.encounter.lastResult` holds only that player's own results. Never store the opponent's special in the public state.
- `DuelOutcome.opponentSpecial` is filled only after both players lock in.
- The endgame summary is public and is sent only when the match ends. It does not show per-round selections.

## 3. Client to server

| Event | Payload | Phase | Purpose |
|---|---|---|---|
| `room:create` | `{ name: string }` | Any | Create a room. Host is the creator. |
| `room:join` | `{ roomCode: string, name: string, sessionToken?: string }` | Any | Join or rejoin. Include the token to reconnect. |
| `room:leave` | `{}` | Any | Leave the room. |
| `lobby:ready` | `{ ready: boolean }` | `lobby` | Set ready state. |
| `game:start` | `{}` | `lobby`, host only | Start the match when 4 to 8 players are ready. |
| `encounter:submit` | `{ value: CardValue, useSpecial: boolean }` | `selecting` | Lock in a card. Once only. |
| `emote:send` | `{ emoteId: string }` | `ended` | Send one preset emote to the room. Rate limited. |

### Payload schemas (summary)

- `name`: 1 to 16 characters after trimming. Control characters removed.
- `roomCode`: exactly 6 characters from the allowed alphabet.
- `sessionToken`: UUID format.
- `value`: integer 1 to 5.
- `useSpecial`: boolean. The server rejects `true` if the player has no `available` special.

## 4. Server to client

### Public events (to the whole room)

| Event | Payload | When |
|---|---|---|
| `room:state` | `PublicRoomState` | Any public change. Full snapshot. `teamCounts` changes only at round summary. |
| `room:error` | `{ code, message }` | Invalid room action for that socket only. |
| `round:paired` | `{ round, pairings, warmUpPlayerId }` | Pairing done. Shows opponents. |
| `round:ended` | `{ round, teamCounts, caughtCount, recoveredCount }` | After resolution. Public counts and their change this round. Drives the announcement banner. |
| `game:started` | `{ originPlayerId }` | Match starts. Triggers role reveal. Origin is public. |
| `game:ended` | `EndgameSummary` | Win check says the game is over. |
| `player:reconnected` | `{ playerId, name }` | A player rejoins. |
| `player:disconnected` | `{ playerId, name }` | A player drops. |
| `emote:shown` | `{ playerId, emoteId }` | A player sent an emote. Public. |

### Private events (to one socket)

| Event | Payload | When |
|---|---|---|
| `room:joined` | `{ roomCode, playerId, sessionToken }` | Join or create succeeded. Token is stored by the client. |
| `player:private-state` | `PrivatePlayerState` | Any change to that player's private state. |
| `encounter:waiting` | `{ opponentId, locked: true }` | Lock-in confirmed. Opponent not yet locked. |
| `encounter:revealed` | `{ myValue, opponentValue, mySpecial, opponentSpecial }` | Both locked in. Sent to the two participants only. |
| `encounter:result` | `DuelOutcome` | Resolution done. Sent to the two participants only. |
| `player:notice` | `PrivateNotice` | Caught, recovered, or auto-locked. |

`player:private-state` is the only source of a private value that is not part of a reveal.

## 5. Ordering guarantees

For one encounter, the server emits in this order:

1. `encounter:waiting` to the first locker, then to the second locker when they lock in.
2. `encounter:revealed` to both participants, only after both lock in or auto-lock.
3. `encounter:result` to both participants.
4. `player:private-state` to both participants.
5. `player:notice` for any caught or recovered player.
6. `round:ended` to the room, after every encounter in the round has resolved.

No public event for an encounter is sent before step 2.

## 6. Reconnect flow

1. Client loads with a stored session token for the room code.
2. Client emits `room:join` with the token.
3. Server matches the token to an existing player. It returns `room:joined` and sends `room:state` and `player:private-state` to that socket only.
4. Server emits `player:reconnected` to the room.
5. If the token does not match an existing player and the game has started, the server returns `room:error` with code `GAME_IN_PROGRESS`.

## 7. Error codes

| Code | Meaning |
|---|---|
| `INVALID_PAYLOAD` | Schema check failed. |
| `ROOM_NOT_FOUND` | Code does not match a room. |
| `ROOM_FULL` | Room has 8 players. |
| `NOT_HOST` | Host-only action from another player. |
| `WRONG_PHASE` | Action not allowed in the current phase. |
| `NOT_IN_ENCOUNTER` | Player has no encounter this round, or is the Warm-Up player. |
| `CARD_UNAVAILABLE` | Card not in hand. |
| `SPECIAL_UNAVAILABLE` | Special already committed or spent, or not held. |
| `ALREADY_LOCKED` | Player has already locked in. |
| `RATE_LIMITED` | Too many events. |
| `GAME_IN_PROGRESS` | Join not allowed after start, unless reconnecting. |
| `INTERNAL` | Unexpected server error. Details are logged, not sent. |

## 8. Rate limits

- 10 events per second per socket. Excess events return `RATE_LIMITED`.
- Room creation: 5 per IP per minute.
- Emotes: 1 per 3 seconds per player.

## 9. Hidden-information checks

Before merging any change to this contract, confirm:

- No event sent before both players lock in contains the other player's `value` or `useSpecial`.
- `round:state` never contains `hand`, `special`, or `encounter` data.
- `player:private-state` is emitted only to its own socket.
- `encounter:revealed` and `encounter:result` are emitted only to the two participants.
