import { useMemo } from 'react';
import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { StatusMessage } from './components/molecules/StatusMessage.js';
import { EndgameSummary } from './components/organisms/EndgameSummary.js';
import { useGame } from './hooks/useGame.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { RoundScreen } from './screens/RoundScreen.js';

const TEAM_LABEL = { survivor: 'Survivor', infected: "Shisa's Army" } as const;

// Chooses the screen from state. Each window keeps its name and team visible at the top.
export function App() {
  const { state, leaveRoom, startNow, selectCard, submitCard, clearNotice } = useGame();
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
        <StatusMessage showSpinner>
          Server waking up. The first connection can take up to a minute.
        </StatusMessage>
      ) : null}
      {state.connection === 'connecting' ? (
        <StatusMessage showSpinner>Connecting...</StatusMessage>
      ) : null}
      {state.connection === 'reconnecting' ? (
        <StatusMessage showSpinner>Reconnecting...</StatusMessage>
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
          onLockIn={() => {
            if (state.selected !== null) submitCard(state.selected);
          }}
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
