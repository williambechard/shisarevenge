import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { useGame } from './hooks/useGame.js';
import { JoinScreen } from './screens/JoinScreen.js';
import { LandingScreen } from './screens/LandingScreen.js';
import { LobbyScreen } from './screens/LobbyScreen.js';
import { RoundScreen } from './screens/RoundScreen.js';

// Chooses the screen from state. The endgame screen comes in plan 04.
export function App() {
  const {
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    selectCard,
    submitCard,
    navigate,
    clearNotice,
  } = useGame();

  return (
    <PhoneFrame>
      {state.screen === 'landing' ? (
        <LandingScreen
          connection={state.connection}
          notice={state.notice}
          onCreate={(name) => {
            clearNotice();
            createRoom(name);
          }}
          onJoin={() => {
            clearNotice();
            navigate('join');
          }}
        />
      ) : null}

      {state.screen === 'join' ? (
        <JoinScreen
          prefillCode={state.prefillCode}
          notice={state.notice}
          onSubmit={(code, name) => {
            clearNotice();
            joinRoom(code, name);
          }}
          onBack={() => {
            navigate('landing');
          }}
        />
      ) : null}

      {state.screen === 'lobby' ? (
        <LobbyScreen
          room={state.room}
          selfId={state.playerId}
          notice={state.notice}
          onToggleReady={setReady}
          onStart={startGame}
          onLeave={leaveRoom}
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
