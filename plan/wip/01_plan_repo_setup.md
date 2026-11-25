# Plan 01: Repo setup

**Goal:** A working monorepo with lint, typecheck, and test running clean on an empty app.
**Source:** `design/07-implementation-plan.md` M0, `02-tech-stack.md`, `05-coding-standards.md`, `09-project-structure.md`.

## Steps

- [x] Create the GitHub repo and push the design docs.
- [x] Add `.gitignore` and `.gitattributes`.
- [ ] Create the root `package.json` with npm workspaces for `client`, `server`, and `shared`. Set `engines` to Node 22.
- [ ] Add `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes`.
- [ ] Scaffold `client` with Vite, React, and TypeScript, and add Tailwind CSS with the Vite plugin.
- [ ] Scaffold `server` with TypeScript, Express, and Socket.IO. Add a `/health` route.
- [ ] Scaffold `shared` with `types.ts`, `events.ts`, `constants.ts`, and `index.ts`.
- [ ] Add the ESLint flat config with typescript-eslint and react-hooks rules.
- [ ] Add Prettier config and `.prettierrc.json`.
- [ ] Add Vitest config to each workspace.
- [ ] Add root scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `format`, and `plans:sweep`.
- [ ] Add `.env.example` with `CLIENT_ORIGIN` and `VITE_SERVER_URL`.
- [ ] Add `README.md` and `CREDITS.md`.
- [ ] Add a placeholder test in each workspace so `npm test` passes.
- [ ] Run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. All must pass.
- [ ] Commit and push.

## Done when

All steps are checked, and the five root scripts pass on a clean clone.
