import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playSfx, setMusic } from './audio/audioManager.js';
import type { MusicTrack } from './audio/tracks.js';
import { MuteToggle } from './components/atoms/MuteToggle.js';
import { STORY_PAGES } from './assets/story/index.js';
import { StoryScreen } from './components/organisms/StoryScreen.js';
import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { VILLAGE_BACKGROUND_ART } from './assets/village/index.js';
import { PlayerBanner } from './components/molecules/PlayerBanner.js';
import { StatusMessage } from './components/molecules/StatusMessage.js';
import { WaitingIndicator } from './components/molecules/WaitingIndicator.js';
import { EndgameSummary } from './components/organisms/EndgameSummary.js';
import { useGame } from './hooks/useGame.js';
import type { GameState } from './state/gameState.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { RoundScreen } from './screens/RoundScreen.js';
import { VillageScreen } from './screens/VillageScreen.js';

// The role shown at the top: the origin is the Cursed Shisa while on Shisa's Army.
function roleOf(
  privateState: { team: 'survivor' | 'infected'; origin: boolean } | null,
): string | null {
  if (!privateState) return null;
  if (privateState.team === 'survivor') return 'Survivor';
  return privateState.origin ? 'Cursed Shisa' : "Shisa's Army";
}

// The background track for each screen. The overview after a match plays no music.
function musicFor(view: View): MusicTrack | null {
  if (view === 'story') return 'story';
  if (view === 'village') return 'village';
  if (view === 'round') return 'duel';
  if (view === 'overview') return null;
  return 'lobby';
}

// Screens fade in and out, so moving between the overview, the village, and a round is not abrupt.
const FADE = { duration: 0.35 };

// Which screen to show. The overview comes first after a match, until the player continues to the village.
// The village comes next, while the room is in its village phase. The round, then the lobby, follow.
type View = 'overview' | 'village' | 'round' | 'lobby' | 'story' | null;

function viewOf(state: GameState): View {
  const room = state.room;
  if (state.screen === 'endgame' && state.endgame && room && !state.overviewDismissed)
    return 'overview';
  // Before the first village of a room, each player reads the story until they finish or skip it.
  if (
    room?.phase === 'village' &&
    room.village &&
    state.playerId !== null &&
    room.village.storyPending.includes(state.playerId)
  ) {
    return 'story';
  }
  if (room?.phase === 'village' && room.village) return 'village';
  if (state.screen === 'round') return 'round';
  if (state.screen === 'endgame' && state.endgame && room) return 'overview';
  if (state.screen === 'lobby') return 'lobby';
  return null;
}
// Chooses the screen from state. Each window keeps its name and role visible at the top.
export function App() {
  const {
    state,
    leaveRoom,
    startNow,
    selectCard,
    submitCard,
    pickCard,
    dismissGained,
    continueToVillage,
    villageStep,
    villageAccuse,
    villageInsert,
    storyDone,
    villageChallenge,
    clearNotice,
  } = useGame();
  // The village tour runs once, in the first village after this room's story.
  const [tourRoom, setTourRoom] = useState<string | null>(null);
  const role = roleOf(state.privateState);
  const self = state.room?.players.find((player) => player.id === state.playerId);

  const view = viewOf(state);
  useEffect(() => {
    setMusic(musicFor(view));
  }, [view]);
  // A win chime for the player whose team won the match.
  const won = state.endgame !== null && state.privateState?.team === state.endgame.winner;
  useEffect(() => {
    if (won) playSfx('success');
  }, [won]);
  // A short low sound when an action is refused. The notice text says why.
  useEffect(() => {
    if (state.notice !== null) playSfx('no');
  }, [state.notice]);

  return (
    <PhoneFrame background={view === 'village' ? VILLAGE_BACKGROUND_ART : undefined}>
      <div className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50">
        <MuteToggle />
      </div>
      {state.name ? <PlayerBanner name={state.name} icon={self?.icon ?? null} role={role} /> : null}
      {state.connection === 'waking' ? (
        <WaitingIndicator
          title="Server waking up"
          detail="The game server sleeps when nobody is playing. The first connection can take up to a minute."
        />
      ) : null}
      {state.connection === 'connecting' ? (
        <WaitingIndicator
          title="Connecting to the game"
          detail="Checking the connection to the game server."
        />
      ) : null}
      {state.connection === 'reconnecting' ? (
        <WaitingIndicator
          title="Reconnecting"
          detail="The connection dropped. Your seat is held while we try again."
        />
      ) : null}
      {state.connection === 'offline' ? (
        <StatusMessage tone="error">You are offline.</StatusMessage>
      ) : null}

      {view === 'lobby' ? (
        <LobbyScreen
          room={state.room}
          selfId={state.playerId}
          notice={state.notice}
          onStartNow={startNow}
          onLeave={() => {
            clearNotice();
            leaveRoom();
          }}
        />
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {view === 'story' ? (
          <StoryScreen
            key="story"
            pages={STORY_PAGES}
            onDone={() => {
              setTourRoom(state.roomCode);
              storyDone();
            }}
          />
        ) : null}

        {view === 'round' ? (
          <motion.div
            key="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className="flex min-h-0 flex-1 flex-col"
          >
            <RoundScreen
              state={state}
              room={state.room}
              onSelect={selectCard}
              onLockIn={submitCard}
              onPick={pickCard}
              onGainedDone={dismissGained}
            />
          </motion.div>
        ) : null}

        {view === 'village' && state.room ? (
          <motion.div
            key="village"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className="flex min-h-0 flex-1 flex-col"
          >
            <VillageScreen
              state={state}
              room={state.room}
              onStep={villageStep}
              onChallenge={villageChallenge}
              onAccuse={villageAccuse}
              onInsert={villageInsert}
              message={state.notice}
              onClearNotice={clearNotice}
              tour={tourRoom !== null && tourRoom === state.roomCode}
              onTourDone={() => {
                setTourRoom(null);
              }}
            />
          </motion.div>
        ) : null}

        {view === 'overview' && state.endgame && state.room ? (
          <motion.div
            key="endgame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            <EndgameSummary
              summary={state.endgame}
              players={state.room.players}
              onBackToStart={leaveRoom}
              onContinue={state.room.phase === 'village' ? continueToVillage : undefined}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PhoneFrame>
  );
}
