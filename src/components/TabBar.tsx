import { Pressable, View } from 'react-native';
import type { Screen } from '../lib/types';
import { CameraIcon, Copy } from './ui';
import { colors } from './theme';
export function TabBar({
  screen,
  onGo,
  onAdd,
  onScan,
}: {
  screen: Screen;
  onGo: (s: Screen) => void;
  onAdd: () => void;
  onScan: () => void;
}) {
  const tabs = [
    { label: 'Registro', icon: '◷', target: 'home' as Screen, press: () => onGo('home') },
    { label: '+ Trago', icon: '+', press: onAdd },
    { label: 'Escanear', icon: '', press: onScan },
    { label: 'Grupo', icon: '≋', target: 'rank' as Screen, press: () => onGo('rank') },
    { label: 'Perfil', icon: '○', target: 'profile' as Screen, press: () => onGo('profile') },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 10,
        paddingBottom: 6,
        backgroundColor: colors.night,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      {tabs.map((t, i) => (
        <Pressable
          key={t.label}
          accessibilityRole={t.target ? 'tab' : 'button'}
          accessibilityLabel={t.label}
          accessibilityState={t.target ? { selected: screen === t.target } : undefined}
          onPress={t.press}
          style={({ pressed }) => ({
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 58,
            gap: 2,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          {i === 2 ? (
            <View style={{ backgroundColor: colors.amber, padding: 12, borderRadius: 30 }}>
              <CameraIcon />
            </View>
          ) : (
            <Copy
              style={{
                fontSize: 25,
                lineHeight: 28,
                color: t.target === screen ? colors.lime : colors.muted,
              }}
            >
              {t.icon}
            </Copy>
          )}
          <Copy
            style={{
              fontSize: 10,
              lineHeight: 15,
              color: t.target === screen ? colors.lime : colors.muted,
            }}
          >
            {t.label}
          </Copy>
        </Pressable>
      ))}
    </View>
  );
}
