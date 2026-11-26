import { useMemo } from 'react';
import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { StatusMessage } from './components/molecules/StatusMessage.js';
import { WaitingIndicator } from './components/molecules/WaitingIndicator.js';
import { EndgameSummary } from './components/organisms/EndgameSummary.js';
import { useGame } from './hooks/useGame.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { RoundScreen } from './screens/RoundScreen.js';

const TEAM_LABEL = { survivor: 'Survivor', infected: "Shisa's Army" } as const;

// Chooses the screen from state. Each window keeps its name and team visible at the top.
export function App() {
  const {
    state,
    leaveRoom,
    startNow,
    selectCard,
    submitCard,
    pickCard,
    dismissGained,
    clearNotice,
  } = useGame();
  const teamLabel = useMemo(
    () => (state.privateState ? TEAM_LABEL[state.privateState.team] : null),
    [state.privateState],
  );

  return (
    <PhoneFrame>
      {state.name ? (
        <p className="text-center text-sm text-navy/70" aria-label="Your name and team">
          You are <span className="font-semibold text-navy">{state.name}</span>
          {teamLabel ? (
            <>
              {' · '}
              <span className="font-semibold text-navy">{teamLabel}</span>
            </>
          ) : null}
        </p>
      ) : null}

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

      {state.screen === 'round' ? (
        <RoundScreen
          state={state}
          room={state.room}
          onSelect={selectCard}
          onLockIn={submitCard}
          onPick={pickCard}
          onGainedDone={dismissGained}
        />
      ) : null}

      {state.screen === 'endgame' && state.endgame && state.room ? (
        <EndgameSummary
          summary={state.endgame}
          players={state.room.players}
          onBackToStart={leaveRoom}
        />
      ) : null}
    </PhoneFrame>
  );
}
