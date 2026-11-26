import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { PlayerBanner } from './components/molecules/PlayerBanner.js';
import { StatusMessage } from './components/molecules/StatusMessage.js';
import { WaitingIndicator } from './components/molecules/WaitingIndicator.js';
import { EndgameSummary } from './components/organisms/EndgameSummary.js';
import { useGame } from './hooks/useGame.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { RoundScreen } from './screens/RoundScreen.js';

// The role shown at the top: the origin is the Cursed Shisa while on Shisa's Army.
function roleOf(
  privateState: { team: 'survivor' | 'infected'; origin: boolean } | null,
): string | null {
  if (!privateState) return null;
  if (privateState.team === 'survivor') return 'Survivor';
  return privateState.origin ? 'Cursed Shisa' : "Shisa's Army";
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
    clearNotice,
  } = useGame();
  const role = roleOf(state.privateState);

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
