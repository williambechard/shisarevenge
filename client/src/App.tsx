import { AnimatePresence, motion } from 'motion/react';
import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { PlayerBanner } from './components/molecules/PlayerBanner.js';
import { StatusMessage } from './components/molecules/StatusMessage.js';
import { WaitingIndicator } from './components/molecules/WaitingIndicator.js';
import { EndgameSummary } from './components/organisms/EndgameSummary.js';
import { useGame } from './hooks/useGame.js';
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
    clearNotice,
  } = useGame();
  const role = roleOf(state.privateState);

  // Which screen is showing. The village is open while the room is in its village phase, after the overview.
  const village = state.room?.phase === 'village' && state.overviewDismissed && state.room.village;
  const endgame = state.screen === 'endgame' && state.endgame && state.room ? state.endgame : null;
  const activeScreen = village
    ? 'village'
    : state.screen === 'round'
      ? 'round'
      : endgame
        ? 'endgame'
        : null;

  return (
    <PhoneFrame>
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

      {state.screen === 'lobby' ? (
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
        {activeScreen === 'round' ? (
          <motion.div
            key="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className="flex flex-1 flex-col"
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

        {activeScreen === 'village' && state.room ? (
          <motion.div
            key="village"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            className="flex flex-1 flex-col"
          >
            <VillageScreen
              state={state}
              room={state.room}
              onStep={villageStep}
              onAccuse={villageAccuse}
              onInsert={villageInsert}
            />
          </motion.div>
        ) : null}

        {activeScreen === 'endgame' && endgame && state.room ? (
          <motion.div
            key="endgame"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            <EndgameSummary
              summary={endgame}
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
