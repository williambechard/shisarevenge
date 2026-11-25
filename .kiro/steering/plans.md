---
inclusion: always
---

# Plan workflow

The build follows the plans in `plan/`. Plans are the working checklist, and the `design/` folder is the spec.

- New and unfinished plans live in `plan/wip/`. Completed plans live in `plan/complete/`.
- Plan files are named `NN_plan_<goal>.md` and run in order. Do not start a plan until the earlier ones are complete.
- Each step is a `- [ ]` line. When a step is done, change it to `- [x]` right away, in the same change that completes it.
- Do not delete steps. If scope changes, add a step and note why.
- After checking off steps, run `npm run plans:sweep` from the repo root. It moves finished plans to `plan/complete/`.
- If a step conflicts with `design/04-game-rules.md`, stop and raise it. The rules file is the spec.
