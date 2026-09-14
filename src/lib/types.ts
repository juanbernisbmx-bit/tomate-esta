/** Tipos compartidos por toda la app. */

export type Sexo = 'H' | 'M' | 'X';

/** Qué está tomando la persona. Lo elige ANTES de sacar la foto. */
export type DrinkKind = 'cerveza' | 'vino' | 'espumante' | 'sidra' | 'trago' | 'shot';

export interface DrinkType {
  id: DrinkKind;
  label: string;
  /** Graduación por defecto (% vol). */
  abv: number;
  /** Volumen típico de esa bebida (ml): lo que se propone al elegirla. */
  ml: number;
  /** Rango razonable para el slider de corrección. */
  abvRange: [number, number];
  hint: string;
  color: string;
}

/**
 * El "vaso": recipiente + bebida + graduación.
 * Puede venir de un preset, de un escaneo con IA o de una carga a mano.
 * El vaso marcado como predeterminado es el que suma el botón "Sumar trago".
 */
export interface Vessel {
  id: string;
  label: string;
  ml: number;
  kind: DrinkKind;
  abv: number;
  source: 'preset' | 'scan' | 'manual';
  /** Foto del escaneo (dataURL) para mostrarla como miniatura. */
  photo?: string;
  /** Confianza 0-100 que devolvió la IA. */
  confidence?: number;
  hint?: string;
}

/** Un trago efectivamente registrado en la noche. */
export interface Trago {
  id: string;
  at: number;
  label: string;
  ml: number;
  kind: DrinkKind;
  abv: number;
  /** Gramos de alcohol puro. */
  grams: number;
  via: 'boton' | 'scan' | 'preset';
}

export interface Profile {
  nombre: string;
  peso: number;
  edad: number;
  sexo: Sexo;
}

export interface Member {
  id: string;
  name: string;
  ini: string;
  color: string;
  /** Gramos de alcohol puro acumulados en la noche. */
  grams: number;
  peso: number;
  sexo: Sexo;
  tragos: number;
  /** Cuándo arrancó la noche: desde ahí corre la eliminación. */
  startedAt: number;
  lastAt: number;
  lastLabel: string;
}

export interface Group {
  code: string;
  name: string;
  members: Member[];
}

export type Screen =
  'welcome' | 'onboarding' | 'group' | 'home' | 'scan' | 'rank' | 'profile' | 'recap' | 'login';

/** Resultado que devuelve la IA al analizar la foto del vaso. */
export interface ScanResult {
  ml: number;
  /** Graduación sugerida para ese recipiente (% vol). */
  abv: number;
  confidence: number;
  vesselLabel: string;
  note: string;
}
