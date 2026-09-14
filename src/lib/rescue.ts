import { Linking, Share } from 'react-native';
import * as Location from 'expo-location';
import { notifyRescue } from '../api/client';

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * "Solicitar rescate": junta la ubicación actual, avisa adentro de la app a
 * los demás integrantes del grupo (vía `notifyRescue` — hoy solo local, ver
 * comentario en `api/client.ts`) y abre WhatsApp con un mensaje de SOS ya
 * armado, listo para mandar.
 *
 * Importante: no existe forma de que una app de terceros arranque una
 * LLAMADA (individual o grupal) de WhatsApp, ni de elegir el grupo de
 * destino por ella — WhatsApp no expone eso a propósito, para que ninguna
 * app le mande mensajes o llame a tus contactos sin que vos lo confirmes. Lo
 * más cercano y real es esto: un mensaje con la ubicación ya redactado, y
 * elegís vos a quién mandárselo (tu grupo de WhatsApp de la previa, por
 * ejemplo) con un toque.
 */
export async function requestRescue(
  { nombre, groupCode }: { nombre: string; groupCode?: string },
  onStatus?: (text: string) => void,
): Promise<void> {
  onStatus?.('Buscando tu ubicación…');
  const coords = await getCoords();

  if (groupCode) {
    try {
      await notifyRescue(groupCode, coords);
    } catch {
      /* Si falla el aviso in-app, el mensaje de WhatsApp de abajo sigue siendo el respaldo. */
    }
  }

  const text = buildMessage(nombre, coords);
  try {
    await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  } catch {
    try {
      await Share.share({ message: text });
    } catch {
      onStatus?.('No pudimos abrir WhatsApp. Copiá el mensaje y mandalo a mano: ' + text);
    }
  }
}

async function getCoords(): Promise<Coords | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return undefined;
    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), 6000);
      }),
    ]);
    return location?.coords;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

function buildMessage(nombre: string, coords?: Coords): string {
  const quien = nombre?.trim() ? nombre.trim() : 'Alguien';
  const ubicacion = coords
    ? `Mi ubicación: https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
    : 'No pude conseguir mi ubicación exacta, pero te necesito.';
  return `🆘 ${quien} pidió un rescate en Tomate. ${ubicacion}`;
}
