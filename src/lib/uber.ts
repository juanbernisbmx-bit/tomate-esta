import { Linking } from 'react-native';
import * as Location from 'expo-location';
const CLIENT_ID = process.env.EXPO_PUBLIC_UBER_CLIENT_ID ?? '';
export function buildUberLink(coords?: { latitude: number; longitude: number }): string {
  const parts: [string, string][] = [['action', 'setPickup']];
  if (CLIENT_ID) parts.push(['client_id', CLIENT_ID]);
  if (coords)
    parts.push(
      ['pickup[latitude]', String(coords.latitude)],
      ['pickup[longitude]', String(coords.longitude)],
    );
  else parts.push(['pickup', 'my_location']);
  return `https://m.uber.com/ul/?${parts.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}
export async function requestUberRide(onStatus?: (text: string) => void): Promise<void> {
  let coords: { latitude: number; longitude: number } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.granted) {
      onStatus?.('Buscando tu ubicación…');
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), 6000);
        }),
      ]);
      coords = location?.coords;
    }
  } catch {
    /* Universal link lets Uber resolve pickup when GPS is unavailable. */
  } finally {
    clearTimeout(timer);
  }
  try {
    await Linking.openURL(buildUberLink(coords));
  } catch {
    onStatus?.('No pudimos abrir Uber. Intentá abrir la app directamente.');
  }
}
