# 13. Art brief for AI-generated images

This brief turns the game rules into image requests. Use it with an image generator. Each request names the rule it illustrates, what the picture must show, what it must not show, and where the file goes.

Rules come from `01-game-design.md`, `04-game-rules.md`, `10-village.md`, and `12-story.md`. Where a request and a rule disagree, the rule wins.

## 1. Global style

Apply to every image.

- **Look:** bold illustrated storybook art. Shisa statues, sea and sky, and winter-wind swirls (`01-game-design.md`, Tone and visual direction).
- **Tone:** playful folklore horror. Mischievous and spooky, never graphic. No gore, no real injury.
- **Palette:** sea blue, coral red, Shisa red, bingata indigo, bingata yellow, bingata green, bingata pink, sand white, warm gold.
- **Setting:** Okinawa in winter. A cold north wind, and a sea that is still warm-blue. Keep it clearly tropical, with a little frost or wind to show the cold.
- **No text in the picture.** The game draws all words itself, so baked-in lettering would clash with the UI and with translations. Leave clear, calm space where a caption box will sit.
- **No real people or faces.** Figures are stylised characters, shown from the back or in silhouette where possible.
- **Team state must not rely on colour alone.** Shisa's Army members wear a Shisa mask (a shisa-style overlay), not only a colour change.
- **Hidden information stays hidden.** No picture may show who the Cursed Shisa or any Shisa's Army member is, unless the picture is about a revealed player.

## 2. Format

| Item | Value |
|---|---|
| Story pictures | 1080 x 1920 px, portrait. JPG or PNG. |
| Background or banner art | 1080 x 1920 px, portrait. JPG. |
| Icons and overlays | Square, 512 x 512 px or larger, PNG with transparent background. |
| Compression | Keep files under 300 KB for story pictures. Compress before adding (see the cards and village art for the pattern). |
| Originals | Keep the full-size original in `design/art-source/`. Put the compressed version in the `client/src/assets/` folder named below. |

## 3. Rule-aligned requests

### 3.1 Story pictures

The story runs before the first village. Each picture pairs with a caption that the game draws on top. The caption text is shown in `client/src/assets/story/index.ts`.

**1_story.jpg** (caption: "The Shisa is the guardian entity of Okinawa.")

- Rule: the Shisa is the guardian. It starts as the Cursed Shisa, one player's origin.
- Show: a large, friendly guardian Shisa statue on a gate or rooftop, watching over a village by the sea.
- Mood: calm, protective, a little magical.
- Avoid: any sign of the curse or the cold.

**2_story.jpg** (caption: "One brutal Okinawa Winter, the Shisa got sick.")

- Rule: the Shisa is cursed by a winter spell and spreads a cold (`01-game-design.md`, Premise).
- Show: the same Shisa, now cracked or frosted, with a cold-wind swirl (wind lines, snowflakes or sea spray) curling out of it.
- Mood: a shift from calm to unease. Playful horror.
- Avoid: blood, wounds, or anything graphic.

**3_story.jpg** (caption: "This ill Shisa now infects others, turning them into their army. Can you survive, beating the Shisa Curse?")

- Rule: a player who catches the cold joins Shisa's Army. Each Army member wears a Shisa mask (`04-game-rules.md`, section 5).
- Show: a crowd of villagers. Some wear the grinning Shisa mask now, and the cold-wind swirl touches them. Leave one or two villagers unmasked, to show a fight to stay free.
- Mood: tense and playful. Not gory.

**5_story.png** (caption: duel rules, "When village time is up you are taken to the Duel. Select a card to risk...")

- Rule: a duel is one card each. Number cards are 1 to 5. The higher number wins, a tie does nothing, and the winner takes an unrevealed card from the loser (`04-game-rules.md`, sections 1, 4.2, 4.6).
- Show: two stylised players facing each other across a stone table. Each has a fan of five face-down cards with the numbers hidden. One card is partly raised, face down.
- Avoid: showing any card value, since the values stay hidden until the reveal.

**Special cards page** is text-only (no picture). Its rules come from `04-game-rules.md`, section 5, and are already in the game.

### 3.2 Village art

The village background (`village_background.jpg`) and the vending machine already exist. Do not regenerate them unless the layout changes. If the village needs a new tile, keep the same walkway style.

### 3.3 Transformation and cold effects

These are the visuals for the cold rule (`04-game-rules.md`, section 7: a Survivor who loses a duel to Shisa's Army catches a cold and joins the Army).

**cold_wind_overlay.png** (optional, for the cold overlay on the duel and village screens)

- Rule: the moment a player catches a cold, and the moment they switch sides.
- Show: a transparent PNG of swirling winter wind and snowflakes, with clear space in the centre.
- Size: 1080 x 1920 px with transparency. Keep the edges busy and the centre empty.

**shisa_mask_icon.png** (already exists as `client/src/assets/village/shisa_mask_icon.png`)

- Rule: a revealed Shisa's Army member wears the mask on their player icon.
- If you regenerate it: a plain shisa-style mask, transparent background, front view, 512 x 512 px.

### 3.4 Player icons

The eight player icons already exist in `client/src/assets/playericons/`. The server gives each player in a room a different one (`10-village.md`, section 2). Do not add more icons unless the game moves past eight players (the maximum is `MAX_PLAYERS` = 8).

### 3.5 Round and endgame art (optional)

These are not built yet. Add them only when the screens need them.

**duel_background.jpg**

- Rule: the duel is a simple one-to-one contest on a table.
- Show: a sandy table under a winter sky, with room in the middle for two card slots.

**endgame_survivors.jpg** and **endgame_army.jpg**

- Rule: Survivors win if any active player is a Survivor after the last round. Shisa's Army wins otherwise (`04-game-rules.md`, section 9).
- Survivors: villagers celebrating on the beach, with the sun coming out and the wind dropping.
- Army: the masked crowd gathered at the gate, with the Shisa glowing.

## 4. File placement

| Art | Folder | Name |
|---|---|---|
| Story pictures | `client/src/assets/story/` | `1_story.jpg`, `2_story.jpg`, `3_story.jpg`, `5_story.png` |
| Cold overlay | `client/src/assets/village/` | `cold_wind_overlay.png` |
| Endgame and duel background | `client/src/assets/` (new `backgrounds/` folder) | as named above |
| Originals | `design/art-source/` | same name, full size |

Story pictures are sorted by the number at the start of their name. Keep the number, so the order stays right.

## 5. Checklist before adding an image

- [ ] Matches the rule it illustrates (section 3).
- [ ] No baked-in text.
- [ ] No hidden role or card value shown, unless it is a revealed role.
- [ ] Team is shown by more than colour (mask or badge).
- [ ] Correct size, format, and file name.
- [ ] Compressed copy in `client/src/assets/`, original in `design/art-source/`.
