/**
 * Catálogo de bebidas y vasos predeterminados.
 * Cuando exista el back, esto se reemplaza por un fetch y se cachea acá mismo.
 */

import type { DrinkKind, DrinkType, Vessel } from './types';

export const DRINK_TYPES: DrinkType[] = [
  {
    id: 'cerveza',
    label: 'Cerveza',
    ml: 473,
    abv: 5,
    abvRange: [3, 12],
    hint: 'Rubia, negra, IPA…',
    color: '#FFB020',
  },
  {
    id: 'trago',
    label: 'Trago',
    ml: 350,
    abv: 8,
    abvRange: [3, 25],
    hint: 'Fernet, vodka, gin, ron…',
    color: '#E8402A',
  },
  {
    id: 'vino',
    label: 'Vino',
    ml: 150,
    abv: 13,
    abvRange: [8, 18],
    hint: 'Tinto, blanco, rosado',
    color: '#9B7BFF',
  },
  {
    id: 'shot',
    label: 'Shot',
    ml: 45,
    abv: 40,
    abvRange: [20, 60],
    hint: 'Tequila, jäger, whisky seco',
    color: '#C6F24E',
  },
  {
    id: 'espumante',
    label: 'Espumante',
    ml: 120,
    abv: 12,
    abvRange: [8, 15],
    hint: 'Champán, prosecco, sidra dulce',
    color: '#5AC8FA',
  },
  {
    id: 'sidra',
    label: 'Sidra',
    ml: 330,
    abv: 5,
    abvRange: [3, 8],
    hint: 'Sidra o bebida frutal',
    color: '#5AC8FA',
  },
];

/**
 * Volumen aceptado para un vaso, en ml. Lo comparten el slider, la validación de
 * lo que devuelve el análisis y el filtro de lo que se recupera del storage: se
 * habían desincronizado y el storage aceptaba hasta 10 000 ml.
 */
export const ML_RANGE: readonly [number, number] = [15, 1500];

export function drinkType(kind: DrinkKind): DrinkType {
  return DRINK_TYPES.find((d) => d.id === kind) ?? DRINK_TYPES[0];
}

/**
 * Acota una graduación al rango razonable de la bebida. La usan el escaneo y la
 * carga manual: elegir "cerveza" no puede terminar en un vaso al 73 % vol.
 */
export function clampAbv(kind: DrinkKind, abv: number): number {
  const [min, max] = drinkType(kind).abvRange;
  if (!Number.isFinite(abv)) return drinkType(kind).abv;
  return Math.min(max, Math.max(min, abv));
}

/**
 * Vasos predeterminados: la salida rápida para el que no quiere sacar foto.
 * `featured` son los que aparecen como chips en la pantalla principal.
 */
export interface Preset extends Vessel {
  featured?: boolean;
}

export const PRESETS: Preset[] = [
  {
    id: 'previa-1l',
    label: 'Vaso de previa 1 L',
    ml: 1000,
    kind: 'trago',
    abv: 6,
    source: 'preset',
    hint: 'El vaso grande de la previa: fernet, vodka o gin con gaseosa',
    featured: true,
  },
  {
    id: 'cerveza-1l',
    label: 'Cerveza 1 L',
    ml: 1000,
    kind: 'cerveza',
    abv: 5,
    source: 'preset',
    hint: 'Registrá solo el volumen que tomaste vos',
    featured: true,
  },
  {
    id: 'vaso-trago',
    label: 'Vaso de trago',
    ml: 350,
    kind: 'trago',
    abv: 9,
    source: 'preset',
    hint: 'Fernet, gin tonic, vodka con jugo',
    featured: true,
  },
  {
    id: 'shot',
    label: 'Shot',
    ml: 45,
    kind: 'shot',
    abv: 40,
    source: 'preset',
    hint: 'Medida de 45 ml',
    featured: true,
  },
  {
    id: 'porron',
    label: 'Porrón',
    ml: 340,
    kind: 'cerveza',
    abv: 5,
    source: 'preset',
    hint: 'La botellita clásica',
  },
  {
    id: 'lata',
    label: 'Lata',
    ml: 473,
    kind: 'cerveza',
    abv: 5,
    source: 'preset',
    hint: 'Lata grande',
  },
  {
    id: 'pinta',
    label: 'Pinta',
    ml: 500,
    kind: 'cerveza',
    abv: 5.5,
    source: 'preset',
    hint: 'Chopp de bar',
  },
  {
    id: 'pinta-ipa',
    label: 'Pinta IPA',
    ml: 473,
    kind: 'cerveza',
    abv: 6.5,
    source: 'preset',
    hint: 'Verificá la graduación en la etiqueta',
  },
  {
    id: 'fernet-largo',
    label: 'Fernet vaso largo',
    ml: 500,
    kind: 'trago',
    abv: 8,
    source: 'preset',
    hint: '70/30 y hielo hasta arriba',
  },
  {
    id: 'copa-vino',
    label: 'Copa de vino',
    ml: 150,
    kind: 'vino',
    abv: 13,
    source: 'preset',
  },
  {
    id: 'vaso-vino',
    label: 'Vaso de vino',
    ml: 250,
    kind: 'vino',
    abv: 13,
    source: 'preset',
  },
  {
    id: 'copa-espumante',
    label: 'Copa de espumante',
    ml: 120,
    kind: 'espumante',
    abv: 12,
    source: 'preset',
  },
];

export const DEFAULT_VESSEL: Vessel = PRESETS[2];

export const FEATURED_PRESETS = PRESETS.filter((p) => p.featured);
