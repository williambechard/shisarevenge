# 05. Coding Standards

**Status:** Locked for the jam build. Follow the stack in `02-tech-stack.md`. Where this file is silent, use the idiomatic practice for TypeScript, React, and Node.js.

## 1. Language and compiler

- TypeScript in `strict` mode on all packages.
- Also enable `noUncheckedIndexedAccess`, `noImplicitOverride`, and `exactOptionalPropertyTypes`.
- No `any`. Use `unknown` and narrow it. If `any` is truly needed, add a comment that explains why and open a task to remove it.
- Prefer `type` for data shapes and unions. Use `interface` only when a declaration needs merging.
- Use `readonly` for data that should not change.
- Use `as const` for literal lists such as card values.
- Use discriminated unions for states, for example `{ phase: 'selecting' } | { phase: 'revealed' }`.
- Avoid enums. Use `as const` objects or string-literal unions.

## 2. Modules and files

- ES modules only (`"type": "module"`).
- Prefer named exports. Do not use default exports for components or utilities.
- One main export per file. Co-locate small helpers that only that file uses.
- File names:
  - React components: `PascalCase.tsx`, for example `NumberCard.tsx`.
  - Non-component modules: `camelCase.ts`, for example `encounterResolver.ts`.
  - Tests: same name with `.test.ts` or `.test.tsx`.
- Imports from `shared/` use the package name, not relative paths that climb out of the package.
- No circular imports. Run a check when adding a new cross-folder import.

## 3. Naming

- Code identifiers use **neutral domain names**. UI text uses **theme names**. Do not put theme words into logic.

| Domain (code) | Theme (UI text) |
|---|---|
| `origin` | Cursed Shisa |
| `team: 'infected'` | Shisa's Army |
| `team: 'survivor'` | Survivors |
| `catchCold` / `caughtCold` | Catch a Cold |
| `recover` / `recovered` | Recover |
| `coldBreath` | Cold Breath |
| `protection-talisman` | Protection Talisman |
| `ramen` | Ramen |
| `shisa-mask` | Shisa Mask |

- Functions: verbs. `resolveEncounter`, `pairPlayers`.
- Booleans: `is`, `has`, `can`, `should` prefixes.
- Constants: `SCREAMING_SNAKE_CASE` for true constants in `shared/constants.ts`.
- Event names: `domain:action` in kebab case, for example `encounter:submit`.
- No abbreviations except `id`, `url`, and `qr`.

## 4. Error handling

- Game rule violations return a typed result, not an exception.

```ts
type Result<T, E extends ErrorCode> = { ok: true; value: T } | { ok: false; error: E };
```

- Throw only for programmer errors (a bug in our code), and catch them at the socket boundary.
- Every error sent to a client has a code and a short, safe message. Raw stack traces never leave the server.
- Log server errors with context but never tokens or hidden selections.

## 5. Validation

- Every socket payload is parsed by a Zod schema in `shared/events.ts` before handlers see it.
- Schemas and inferred types live in the same file. Use `z.infer` for the type.
- Validate environment variables once at startup. Fail fast if one is missing.

## 6. Game logic

- Rules live in `server/src/game/` as pure functions: input state and action, output new state or a typed error. No I/O, no timers, no `Date.now()` inside them. Pass time in as a parameter.
- Randomness comes from an injected `random` function, so tests can use a fixed seed.
- The engine never mutates its input. Return new objects.
- The client does not import resolution logic. It renders what the server sends.

## 7. React

- Function components only. No class components.
- Hooks follow the rules of hooks. ESLint must pass.
- Keep components small. Extract a component when it has a second use or when it exceeds about 150 lines.
- Props are typed with a named `type`. Avoid spreading unknown props onto DOM elements.
- Keep server state in one place: a reducer fed by socket events. Do not copy the same server state into several `useState` calls.
- Do not derive state with `useEffect`. Compute it during render.
- Use stable `key` values. Never use array index as a key for lists that can reorder.
- Use `React.memo` only after a measured render problem.

## 8. Styling

- Tailwind utilities in JSX. Use `@apply` only in a base stylesheet for repeated patterns.
- Mobile-first breakpoints. Write the phone layout first, then add larger screen rules only if needed.
- Use theme tokens for colors (sea blue, coral red, and so on) defined once in the Tailwind config or CSS theme.
- Touch targets are at least 44 by 44 CSS pixels.

## 9. Accessibility

- Use semantic elements: `button`, `ul`, `section`, `h1` to `h3`.
- Every icon-only button has an `aria-label`.
- Team and card state use text and icons, not color alone.
- Focus states are visible.
- Live regions announce round changes and results (`aria-live="polite"`).
- Check the screens with a screen reader once before the party.

## 10. Testing

- Unit tests (Vitest) for all of `server/src/game/` and the reducer. Cover every rule in `04-game-rules.md` and every invariant in section 11.
- Socket handler tests for validation: a bad payload returns a clean error, and a valid payload from the wrong phase is rejected.
- Hidden-information test: a fixed scenario must show that no payload sent before lock-in contains the other player's value.
- Manual device tests with the checklist in `07-implementation-plan.md`.
- Tests are deterministic. No real timers. Use fake timers or inject time.

## 11. Git and workflow

- Work on `main` with short-lived feature branches. Merge with a pull request, or push to `main` directly for solo work with the quality gates passing.
- Commit messages use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- One logical change per commit. Keep commits small enough to explain in one line.
- Never commit `.env`, `node_modules`, `dist`, or build output.
- Never force-push `main`.

## 12. Scripts

Root `package.json` provides:

- `npm run dev`: client and server together
- `npm run build`: build client and server
- `npm run typecheck`: `tsc --noEmit` in every workspace
- `npm run lint`: ESLint for the whole repo
- `npm test`: Vitest for the whole repo
- `npm run format`: Prettier write

## 13. Comments and docs

- Code explains what it does. Comments explain why, especially for rule decisions. Each rule decision in `04-game-rules.md` section 12 should have a comment where it is implemented.
- Keep the `design/` folder in sync with code changes that change behavior.
- Do not leave `TODO` without a task reference in `07-implementation-plan.md`.

## 14. Security reminders

These rules come from `03-guardrails.md`. Follow them in code:

- Validate every input.
- Never trust a client's team, card, or result.
- Never log tokens or hidden selections.
- Keep CORS limited to the client origin.
