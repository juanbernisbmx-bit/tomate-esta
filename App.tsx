import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { SpaceGrotesk_400Regular } from '@expo-google-fonts/space-grotesk/400Regular';
import { AppProvider } from './src/state/store';
import NativeApp from './src/App';
void SplashScreen.preventAutoHideAsync().catch(() => {});
export default function App() {
  const [loaded, error] = useFonts({
    Anton: Anton_400Regular,
    SpaceGrotesk: SpaceGrotesk_400Regular,
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error)
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0908', justifyContent: 'center' }}>
        <ActivityIndicator color="#C6F24E" />
      </View>
    );
  if (error)
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0908', padding: 32, justifyContent: 'center' }}>
        <Text style={{ color: '#FAF7F2' }}>
          No se pudieron cargar las fuentes de Tomate. Cerrá y volvé a abrir la app.
        </Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <NativeApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}
