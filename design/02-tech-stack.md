# 02. Tech Stack

**Status:** Locked for the 2-week jam build.

The stack is chosen for speed of delivery, low hosting cost, and strict server authority. Use the current stable release of each library at the time of setup. Commit the lockfile.

## Summary

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Shared types across client and server. Catches mistakes before a party. |
| Runtime | Node.js 22 LTS | Current long-term support line. Node 20 reaches end of life in April 2026. |
| Package manager | npm workspaces | Built into Node. One lockfile. No extra tooling. |
| Frontend | React | Component model suits cards, lobbies, and lists. |
| Build tool | Vite | Fast dev server and static production build. |
| Styling | Tailwind CSS (v4 with the Vite plugin) | Mobile-first utilities. No separate CSS files to manage. |
| Icons | lucide-react | Consistent icons. Tree-shaken. |
| QR codes | `qrcode` | Small, no runtime service needed. |
| Realtime | Socket.IO (v4) | Rooms, reconnects, and events out of the box. |
| Server | Node.js with Express | Hosts the Socket.IO server and a `/health` endpoint. |
| Runtime validation | Zod | Validates every incoming socket payload at the trust boundary. |
| Unit tests | Vitest | Same syntax as Vite. Fast. Covers the pure game rules. |
| Lint | ESLint (flat config) with typescript-eslint and eslint-plugin-react-hooks | Catches bugs and hook misuse. |
| Format | Prettier | No formatting debates. |
| Hosting: client | Vercel (static) | Free tier. Automatic deploys from GitHub. |
| Hosting: server | Render (Node web service) | Long-running process for WebSockets. |
| Source control | GitHub | Repo and automatic deploys. |
| Database | None | Rooms and state live in server memory. |

## Why not the alternatives

- **A game engine (Phaser, Unity):** The game is turn-based and card-driven. An engine adds weight and learning time without a benefit here.
- **Serverless functions for the realtime layer:** Socket.IO needs a long-lived process. Serverless functions do not provide one.
- **Firebase or another hosted realtime service:** Adds a vendor, rules language, and a second source of truth. The server must be authoritative, so the rules belong in code we run.
- **A database:** Rooms last for one party. Persistence adds setup cost and a second failure mode.
- **Next.js:** Not needed. The client is a single-page app and the server is a separate process.

## Hosting notes

- **Free Render tier sleeps after inactivity.** Before the party, open the server health URL a few minutes ahead to wake it. If sleep is a problem on the day, upgrade the service for the event window only.
- **Environment variables:** `CLIENT_ORIGIN` (the Vercel URL, used for CORS), `PORT` (set by Render), `NODE_ENV`. Never commit `.env` files.
- **Client environment variable:** `VITE_SERVER_URL`, the HTTPS URL of the server.
- **Server host:** Render, as a Node web service with Root Directory `server`. The free tier sleeps after inactivity, so the first connection can take up to about a minute. The client must show a "Server waking up" message with a spinner until the connection opens. If the party needs no wait at all, upgrade the service for the event window only.

## Version policy

- Pin the Node version in `package.json` with `engines`.
- Commit `package-lock.json`.
- Update dependencies only in the planned update window (day 13). Do not upgrade during feature work.

## Out of scope for the stack

- No authentication library (no accounts).
- No analytics SDK.
- No state management library. Use React state plus a small reducer, fed by server events.
- No end-to-end browser test framework in the jam. Use manual device tests, listed in `07-implementation-plan.md`.
