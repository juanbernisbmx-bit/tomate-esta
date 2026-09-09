import { Pressable, View } from 'react-native';
import type { Screen } from '../lib/types';
import { CameraIcon, Copy, TabIcon, type TabIconName } from './ui';
import { colors } from './theme';
/** `icon: null` es el botón de la cámara, que va destacado en el centro. */
interface Tab {
  label: string;
  icon: TabIconName | null;
  target?: Screen;
  press: () => void;
}

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
  const tabs: Tab[] = [
    { label: 'Registro', icon: 'registro', target: 'home' as Screen, press: () => onGo('home') },
    { label: '+ Trago', icon: 'mas', press: onAdd },
    { label: 'Escanear', icon: null, press: onScan },
    { label: 'Grupo', icon: 'grupo', target: 'rank' as Screen, press: () => onGo('rank') },
    { label: 'Perfil', icon: 'perfil', target: 'profile' as Screen, press: () => onGo('profile') },
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
          {t.icon === null ? (
            <View style={{ backgroundColor: colors.amber, padding: 12, borderRadius: 30 }}>
              <CameraIcon />
            </View>
          ) : (
            <TabIcon
              name={t.icon}
              size={25}
              color={t.target === screen ? colors.lime : colors.muted}
            />
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
