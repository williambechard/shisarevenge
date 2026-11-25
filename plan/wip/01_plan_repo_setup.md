# Plan 01: Repo setup

**Goal:** A working monorepo with lint, typecheck, and test running clean on an empty app.
**Source:** `design/07-implementation-plan.md` M0, `02-tech-stack.md`, `05-coding-standards.md`, `09-project-structure.md`.

## Steps

- [x] Create the GitHub repo and push the design docs.
- [x] Add `.gitignore` and `.gitattributes`.
- [x] Create the root `package.json` with npm workspaces for `client`, `server`, and `shared`. Set `engines` to Node 22.
- [x] Add `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes`.
- [x] Scaffold `client` with Vite, React, and TypeScript, and add Tailwind CSS with the Vite plugin.
- [x] Scaffold `server` with TypeScript, Express, and Socket.IO. Add a `/health` route.
- [x] Scaffold `shared` with `types.ts`, `events.ts`, `constants.ts`, and `index.ts`.
- [x] Add the ESLint flat config with typescript-eslint and react-hooks rules.
- [x] Add Prettier config and `.prettierrc.json`.
- [x] Add Vitest to each workspace. Each workspace runs `vitest run` with its default config.
- [x] Add root scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `format`, and `plans:sweep`.
- [x] Add `.env.example` with `CLIENT_ORIGIN` and `VITE_SERVER_URL`.
- [x] Add `README.md` and `CREDITS.md`.
- [x] Add a placeholder test in each workspace so `npm test` passes.
- [x] Run `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. All must pass.
- [ ] Commit and push.

## Done when

All steps are checked, and the five root scripts pass on a clean clone.

## Notes

- Local Node is 20.19.5. The `engines` field asks for Node 22, so npm prints a warning. Install Node 22 before deploying.
- `server` and `client` import `@shisa-revenge/shared` through its built `dist/` output. Run `npm run build -w shared` before starting them directly. `npm run dev` does this automatically.
- Lint passes with the strict typed config. The one exception is `.d.ts` files, which may use `interface` for global augmentation.
