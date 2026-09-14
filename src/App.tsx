import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { Shell } from './components/Shell';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { Welcome } from './screens/Welcome';
import { Onboarding } from './screens/Onboarding';
import { GroupJoin } from './screens/GroupJoin';
import { Home } from './screens/Home';
import { Scan } from './screens/Scan';
import { Rank } from './screens/Rank';
import { Profile } from './screens/Profile';
import { Login } from './screens/Login';
import { Recap } from './screens/Recap';
import type { Screen } from './lib/types';
import { useActions, useApp } from './state/store';
const WITH_TABS: Screen[] = ['home', 'rank', 'profile', 'recap'];
export default function App() {
  const state = useApp();
  const actions = useActions();
  const { screen, profile } = state;
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home' || screen === 'welcome' || screen === 'onboarding') return false;
      actions.go('home');
      return true;
    });
    return () => listener.remove();
  }, [screen, actions]);
  return (
    <Shell>
      <View style={{ flex: 1 }}>
        {screen === 'welcome' && <Welcome onStart={() => actions.go('onboarding')} />}
        {screen === 'onboarding' && (
          <Onboarding
            profile={profile}
            onChange={actions.setProfile}
            onExit={() => actions.go('welcome')}
            onDone={() => {
              actions.finishOnboarding();
              actions.go(state.group ? 'home' : 'group');
            }}
          />
        )}
        {screen === 'group' && (
          <GroupJoin
            onJoin={(g) => {
              actions.setGroup(g);
              actions.go('home');
            }}
            onSkip={() => actions.go('home')}
          />
        )}
        {screen === 'home' && <Home />}
        {screen === 'scan' && <Scan />}
        {screen === 'rank' && <Rank />}
        {screen === 'profile' && <Profile />}
        {screen === 'login' && <Login />}
        {screen === 'recap' && <Recap />}
      </View>
      {WITH_TABS.includes(screen) && (
        <TabBar
          screen={screen}
          onGo={actions.go}
          onScan={() => actions.go('scan')}
          onAdd={() => {
            const t = actions.addTrago();
            actions.showToast(`Registraste ${t.label}`, {
              undoId: t.id,
              hint: 'Si tomaste, no manejes.',
            });
          }}
        />
      )}
      <Toast
        toast={state.toast}
        onUndo={actions.undoTrago}
        onRestore={actions.restoreTrago}
        onClose={actions.hideToast}
        offset={WITH_TABS.includes(screen) ? 110 : 35}
      />
    </Shell>
  );
}
