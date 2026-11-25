# Plans

Plans turn the `design/` documents into ordered, checkable work.

## Folders

- `wip/`: new and unfinished plans.
- `complete/`: plans where every step is checked off.

## File names

`NN_plan_<goal>.md`, where `NN` is a two-digit order number and `<goal>` is a short name in snake case. Example: `02_plan_multiplayer_foundation.md`.

Order numbers set the build sequence. Plans run in order, and a later plan starts only after the earlier one is complete.

## Checklist rules

- Each step is a line that starts with `- [ ]`.
- When a step is done, change it to `- [x]`.
- Do not delete steps. Add new steps if the scope changes, and note the change in the plan.
- A plan is complete when every step is `[x]`.

## Auto-move

Run `npm run plans:sweep` from the repo root. The script moves every plan in `wip/` whose steps are all checked into `complete/`. A plan with no checklist items stays in `wip/`.

## Plan order

| Order | Plan | Source |
|---|---|---|
| 01 | repo_setup | `07` milestone M0 |
| 02 | multiplayer_foundation | `07` milestone M1 |
| 03 | core_card_duel | `07` milestone M2 |
| 04 | teams_infection_win | `07` milestone M3 |
| 05 | special_cards | `07` milestone M4 |
| 06 | polish_and_deploy | `07` days 12 to 14 |
| 07 | optional_audio_and_village | `01` optional list |
