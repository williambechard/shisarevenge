# 12. Story

The story is a set of full-screen pictures that explain how to play. Each player reads it once, when the room first starts, before the first village.

## 1. When it shows

- The first match of a room only. Later matches go straight to the village.
- Each player sees the story before they are in the village. Skip also ends it, and the player lands in the village.
- The first village's timer does not start until every connected player has finished or skipped the story. A player who drops out does not hold the room. A player who returns reads the story before moving on.
- While the story is open, the village is open behind it (the timer ring is hidden until it starts).

## 2. Pictures

Put the pictures in `client/src/assets/story/`. They are shown in filename order, so name them to sort in reading order, for example `01_intro.png`, `02_how_to_play.png`. Supported formats: png, jpg, jpeg, webp. No code change is needed when pictures are added, removed, or reordered. With no pictures, the story shows a short welcome page.

## 3. Pages

Pages can carry text. A caption sits under the picture, or on its own page when there is no picture. Captions are keyed by the picture's filename in client/src/assets/story/index.ts. Text-only pages (for example the special card rules, between the 5 and 6 pictures) are listed there too. Each page stays up for 5 seconds, so long text may need a longer time or a page split.

Each picture is one full-screen page. Pages slide in from the side the player moves toward, tilt slightly, and settle with a spring. The picture drifts slowly. Each page stays up for 5 seconds, then the story moves on by itself. Tapping the picture or the Next button also moves on. The last page ends the story after its 5 seconds, so no player can sit on the story forever. The server also opens the village after storyMaxMs (60 seconds) if a player never sends their done message. The last page's button reads Start playing. A dot shows each page. Skip is at the top right.

## 4. Server

`storyPending` lists the players still reading. The village view carries it, so each client knows whether to show the story. The client sends `story:done` when the player finishes or skips. The server starts the village timer once no connected player is still reading. Tests can turn the gate off with the `storyGate` timing option.

## 5. Music

The story plays the `story` track (see design/11-audio.md).

## 6. Village tour

After the story, each player's first village of the room opens with a guided tour. Five tips point at real parts of the village screen, in order, and each stays for 5 seconds. A bar under the tip empties to show the time left. The tour overlay ignores taps, so players can keep moving meanwhile.

1. The team bar at the top: the Survivors against Shisa's Army.
2. The timer ring at the right: time until the next Duel.
3. The vending machine tile.
4. The player's own token: move freely around the village.
5. The first other player's token: colliding with a player allows an accusation (costs 1 card) or a challenge, which locks both as opponents.

The tips point at live elements (`data-tour` attributes), so they stay right when the layout changes. Tips are in `client/src/components/organisms/VillageTour.tsx`.