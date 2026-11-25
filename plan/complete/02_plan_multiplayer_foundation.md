# Plan 02: Multiplayer foundation

**Goal:** Players are placed in a room automatically, see the same lobby, and keep their seat through a refresh. The room starts when it is full.
**Source:** `design/07-implementation-plan.md` M1, `03-guardrails.md`, `08-socket-contract.md` sections 3 to 6, `01-game-design.md` section 8.

## Steps

### Server

- [x] Create the Express app with `/health` and Socket.IO attached.
- [x] Set CORS to allow only `CLIENT_ORIGIN`.
- [x] Add Zod schemas in `shared/events.ts` for the lobby events. (Superseded in part by the auto-placement steering: `room:enter` and `room:leave` replace the create, join, and ready events.)
- [x] Add a validation wrapper that returns `INVALID_PAYLOAD` on bad input.
- [x] Implement room codes with `crypto.randomInt` and the unambiguous alphabet. Unit test them.
- [x] Implement the room registry: create, find, and expire. Expire rooms after 2 hours of inactivity.
- [x] Implement session tokens with `crypto.randomUUID()`. Unit test reconnect by token.
- [x] Broadcast `room:state` to everyone in the room on each lobby change.
- [x] Enforce the 8-player limit. A full room starts its match, and the next player goes to a new room.
- [x] Add per-socket rate limiting at 10 events per second.
- [x] Add the room creation cap of 5 per IP per minute. It applies only when a new room starts.

### Client

- [x] Build the Landing and Join screens. (Superseded: the steering removed both screens, and the page now places the player on load.)
- [x] Build the Lobby screen with the assigned name, player list, and seats left.
- [x] Add the QR code on the Lobby screen. (Superseded: removed by the steering.)
- [x] Store the session token in `sessionStorage`, per tab. (Changed from `localStorage` by the SEAT_IN_USE fix.)
- [x] Show connection status: connecting, connected, reconnecting, and offline.
- [x] Show a "Server waking up" spinner while the first connection is pending.
- [x] Add the socket client with reconnect settings.

### Auto-placement steering (added after the first manual test)

- [x] Replace room creation and joining with `room:enter`. A new window joins the oldest open lobby, or starts a room.
- [x] Assign one of eight fun names from `PLAYER_NAMES`, unique within the room.
- [x] Start the match automatically when the eighth player enters.
- [x] Remove the ready state, the host, the Start button, and the QR code.
- [x] Refuse a rejoin while another connected window holds the seat (`SEAT_IN_USE`). The client retries for a short time before it gives up.
- [x] Tests cover placement, names, the full-room start, takeover refusal, and reconnect.

### Tests and checks

- [x] Socket test: a bad payload returns `INVALID_PAYLOAD` and no state change.
- [x] Socket test: a rejoin with a known token reuses the seat.
- [x] Manual test: eight browser windows or phones open the game and land in the same lobby.
- [x] Manual test: refreshing one window keeps the same seat and name.

## Done when

All steps are checked. Eight windows share one lobby, the match starts when the eighth arrives, and a refresh keeps the seat.

## Notes

- Test with eight windows, each in its own browser profile. Windows in one profile share nothing, which is the point of the per-tab session. Chrome incognito windows share storage with one another, so use profiles, not incognito.
- Start the app with `npm run dev`, then open `http://localhost:5173` in each window.
- The manual checks need people at the browsers. This plan stays in `wip/` until they pass.
