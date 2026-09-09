import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';
export function Shell({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.night }}
      edges={['top', 'left', 'right', 'bottom']}
    >
      {children}
    </SafeAreaView>
  );
}
