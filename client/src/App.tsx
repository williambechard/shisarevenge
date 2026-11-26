import { AnimatePresence, motion } from 'motion/react';
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

// Screens fade in and out, so moving between the overview, the village, and a round is not abrupt.
const FADE = { duration: 0.35 };

// Which screen to show. The overview comes first after a match, until the player continues to the village.
// The village comes next, while the room is in its village phase. The round, then the lobby, follow.
type View = 'overview' | 'village' | 'round' | 'lobby' | null;

function viewOf(state: GameState): View {
  const room = state.room;
  if (state.screen === 'endgame' && state.endgame && room && !state.overviewDismissed)
    return 'overview';
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
    villageChallenge,
    clearNotice,
  } = useGame();
  const role = roleOf(state.privateState);

  const view = viewOf(state);

  return (
    <PhoneFrame background={view === 'village' ? VILLAGE_BACKGROUND_ART : undefined}>
      {state.name ? <PlayerBanner name={state.name} role={role} /> : null}
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
