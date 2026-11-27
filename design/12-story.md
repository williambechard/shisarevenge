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

Each picture is one full-screen page. Pages slide in from the side the player moves toward, tilt slightly, and settle with a spring. The picture drifts slowly. Tapping the picture or the Next button moves on. The last page's button reads Start playing. A dot shows each page. Skip is at the top right.

## 4. Server

`storyPending` lists the players still reading. The village view carries it, so each client knows whether to show the story. The client sends `story:done` when the player finishes or skips. The server starts the village timer once no connected player is still reading. Tests can turn the gate off with the `storyGate` timing option.

## 5. Music

The story plays the `story` track (see design/11-audio.md).