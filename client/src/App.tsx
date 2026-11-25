import { PhoneFrame } from './components/templates/PhoneFrame.js';
import { useGame } from './hooks/useGame.js';
import { JoinScreen } from './screens/JoinScreen.js';
import { LandingScreen } from './screens/LandingScreen.js';
import { LobbyScreen } from './screens/LobbyScreen.js';

// Chooses the screen from state. Game screens for rounds and endgame come in later plans.
export function App() {
  const { state, createRoom, joinRoom, leaveRoom, setReady, navigate, clearNotice } = useGame();

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
          onLeave={leaveRoom}
        />
      ) : null}
    </PhoneFrame>
  );
}
