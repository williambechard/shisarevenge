# 09. Project Structure and Asset Locations

**Status:** Locked for the jam build. This file is the single reference for where code, shared types, and graphics live. Other design files point here.

## 1. Repository root

The game lives at the workspace root, `C:\Users\ury2o\okiwinter`. The root is the Git repository and the npm workspace root.

```text
okiwinter/
├── client/                 React and Vite app (deployed to Vercel)
├── server/                 Node, Express, and Socket.IO server (deployed to Render)
├── shared/                 Types, Zod schemas, and constants used by both sides
├── design/                 Design documents (this folder)
├── plan/                   Planning notes (not built)
├── src/                    Unused. Empty. See section 7.
├── package.json            Workspace root and root scripts
├── package-lock.json
├── tsconfig.base.json      Shared TypeScript settings
├── eslint.config.mjs
├── .prettierrc.json
├── .gitignore
├── .env.example            Variable names only. Never real values.
├── CREDITS.md              Credits for third-party art, fonts, and icons
└── README.md
```

## 2. Client

```text
client/
├── public/                 Static files served at fixed URLs (see section 3)
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── assets/             Art and fonts imported by components (see section 3)
│   │   ├── cards/          Numbered and special card art
│   │   ├── shisa/          Cursed Shisa art and mask overlays
│   │   ├── textures/       Bingata patterns, wind swirls, backgrounds
│   │   ├── fonts/          Webfont files, if any
│   │   └── audio/          Sound effects and background music (see section 3)
│   ├── components/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   └── templates/
│   ├── screens/            One file per app screen
│   ├── socket/             Socket.IO client and event handlers
│   ├── state/              Reducer, state types, and session helpers
│   ├── hooks/              React hooks (useGame, useCountdown)
│   ├── styles/             Tailwind entry CSS and theme tokens
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

The `/dev/components` preview route described in `06-atomic-design.md` is gated behind `import.meta.env.DEV`. It is not built into production.

## 3. Where graphics live

Graphics come in two kinds, and each kind has one home.

| Kind | Location | Why |
|---|---|---|
| Art used by components (cards, the Shisa, textures) | `client/src/assets/` | Vite hashes and bundles these. Imports are type-checked. Missing files break the build, not the game at runtime. |
| Files that need a fixed URL (favicon, social preview image) | `client/public/` | Served as-is at `/favicon.svg` and similar paths. |
| Editable source files (`.ai`, `.psd`, `.kra`, `.fig`, layered exports) | `design/art-source/` | Not bundled. Keeps the working files out of the deployed build. |
| Sound effects and background music | `client/src/assets/audio/` | Bundled and hashed like other assets. A small audio helper in `client/src/` imports them by path. |
| Editable audio source files (`.wav`, `.flp`, DAW projects) | `design/audio-source/` | Not bundled. |
| Credits and licenses for all third-party art, fonts, audio, and icons | `CREDITS.md` at the root | Required by `03-guardrails.md` section 9. |

### Asset rules

- **Formats:** Use SVG for flat shapes, icons, and anything that must scale. Use WebP or PNG for raster art. Use PNG for images that need transparency and cannot be SVG.
- **File names:** Lowercase kebab case, with the subject first. Examples: `card-kitakaze.svg`, `shisa-cursed.svg`, `mask-overlay.png`, `bingata-band-indigo.svg`.
- **Size limits:** Any one bundled image is 200 KB or less. The total of `client/src/assets/` and `client/public/` is 2 MB or less. Check these before the party, since the free Vercel tier and mobile data both matter.
- **Dimensions:** Raster art is exported at 2x the largest on-screen size, not at print size.
- **Alt text:** Every image rendered by a component takes an `alt` prop, or `alt=""` when it is decorative. Never leave `alt` out.
- **No copyrighted material:** Art must be original, licensed for free use, or explicitly credited in `CREDITS.md`.

### Audio rules

- **Format:** MP3 for all sound effects and music. Safari and Chrome on phones both play it, so one format covers the target devices.
- **Music:** One looping background track, 60 seconds or less, under 1 MB.
- **Sound effects:** Short clips, under 2 seconds, under 100 KB each. Target about 6 effects: card lock-in, reveal, freeze, recover, shield block, and round start.
- **Budget:** All audio together is 3 MB or less.
- **Naming:** `sfx-<event>.mp3` for effects and `bgm-<scene>.mp3` for music, for example `sfx-reveal.mp3` and `bgm-lobby.mp3`.
- **Autoplay:** Mobile browsers block audio until the player taps something. Start music after the first tap on Create Game or Join Game.
- **Mute:** A mute toggle on every screen. The choice is saved in `localStorage`.
- **Scope:** Audio is optional for the jam. See `01-game-design.md` section 13.

### Jam placeholder art

For the first build, use the placeholders in `07-implementation-plan.md` day 12. Create them as SVG files in `client/src/assets/shisa/` and `client/src/assets/textures/`. Replace them later without changing the component code, because the components import by path.

## 4. Server

```text
server/
├── src/
│   ├── game/               Pure rules (see 06-atomic-design.md section 5)
│   ├── rooms/              Room registry, room codes, session tokens
│   ├── socket/             Event handlers, validation, rate limits, broadcasts
│   ├── http/               Health endpoint
│   └── index.ts            Entry point
├── tsconfig.json
└── package.json
```

The server has no assets. It sends text and state only.

## 5. Shared

```text
shared/
├── types.ts
├── events.ts               Zod schemas and event names
├── constants.ts
├── index.ts                Re-exports the three files above
└── package.json
```

`shared/` holds data and schemas only. Neither client nor server puts game logic here.

## 6. Design folder

```text
design/
├── frostys-revenge-design-doc.md   Original source, kept for reference
├── 01-game-design.md
├── 02-tech-stack.md
├── 03-guardrails.md
├── 04-game-rules.md
├── 05-coding-standards.md
├── 06-atomic-design.md
├── 07-implementation-plan.md
├── 08-socket-contract.md
├── 09-project-structure.md         This file
├── art-source/                     Editable art files. Not bundled.
└── audio-source/                   Editable audio files. Not bundled.
```

## 7. Open item: the empty `src/` and `plan/` folders

The workspace root already contains empty `src/` and `plan/` folders. This layout does not use `src/` at the root, because code lives in `client/`, `server/`, and `shared/`. The plan is to leave both folders in place for now and remove `src/` only after you confirm it is empty and unused. Let me know if you want `plan/` used for something specific.

## 8. Rules for changing the structure

- A new top-level folder needs a line in this file first.
- Game logic never goes into `client/` or `shared/`.
- Assets never go into `server/`.
- If a folder is renamed, update this file, `01-game-design.md` section 12, and `06-atomic-design.md`.
