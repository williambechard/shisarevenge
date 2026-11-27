# 11. Audio

Music and sound effects. Files live in `client/src/assets/audio/`. The code is in `client/src/audio/`.

## 1. Music

| Track | File | Plays on |
|---|---|---|
| lobby | `music/lobby.mp3` | Lobby, and before a room is joined |
| duel | `music/duel.mp3` | Duel (round) screen |
| village | `music/village.mp3` | Village screen |
| story | `music/story.mp3` | Story screen (not built yet) |

Music loops. The overview after a match plays no music. Music starts at the first tap on the page, because browsers block sound before a tap.

## 2. Sound effects

| Sound | File | Plays when |
|---|---|---|
| select | `sfx/select.wav` | A card is tapped in the hand or in a card choice |
| no | `sfx/no.wav` | A server action is refused (the notice text says why) |
| bad | `sfx/bad.wav` | Bad news for this player: caught a cold, lost a card, eliminated, accused, time ran out, or a wrong accusation |
| success | `sfx/success.mp3` | Good news for this player: recovered, took a card, used the machine, a correct accusation, or their team won the match |
| step | `sfx/step.mp3` | A village move is accepted |
| tick | `sfx/repeatedTimeAlmostUp.wav` | Last 10 seconds of any ring timer. Ticks speed up as time runs out, from one per second to about one per 0.15 seconds |

## 3. Mute

A mute toggle sits at the top right of every screen. The choice is saved in `localStorage` under `shisa-revenge:muted`. It is a player preference, not a seat token, so it is safe there.

## 4. Size

Music is encoded as MP3 at 80 to 96 kbps stereo. Each track is under 1 MB: duel 899 KB, lobby 301 KB, village 363 KB, story 405 KB. The original files are kept in design/art-source/audio/music/. Browsers fetch a track only when it plays.
