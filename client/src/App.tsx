import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { StatusMessage } from './components/molecules/StatusMessage.js';
import { useGame } from './hooks/useGame.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { RoundScreen } from './screens/RoundScreen.js';

// Players are placed in a room on load. The screen follows the match state.
export function App() {
  const { state, leaveRoom, startNow, selectCard, submitCard, clearNotice } = useGame();

  return (
    <PhoneFrame>
      {state.name ? (
        <p className="text-center text-sm text-navy/70" aria-label="Your name">
          You are <span className="font-semibold text-navy">{state.name}</span>
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
    </PhoneFrame>
  );
}
