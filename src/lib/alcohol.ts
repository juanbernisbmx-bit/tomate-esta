/**
 * Cálculo de alcohol en sangre (Widmark simplificado).
 *
 * Todo lo de acá es una ESTIMACIÓN para jugar entre amigos: no reemplaza
 * un alcoholímetro ni sirve como prueba legal. Se documenta el modelo para
 * que el back pueda replicar exactamente los mismos números.
 */

import type { DrinkKind, Member, Profile, Sexo, Trago } from './types';

/** Densidad del etanol (g/ml). */
export const ETHANOL_DENSITY = 0.789;

/** Factor de distribución corporal de Widmark, por sexo. */
export const R_FACTOR: Record<Sexo, number> = { H: 0.68, M: 0.55, X: 0.615 };

/** Eliminación hepática promedio, en ‰ por hora. */
export const ELIMINATION_PER_HOUR = 0.15;

/** Tiempo de absorción de un trago (minutos): la suba no es instantánea. */
export const ABSORPTION_MIN = 20;

/** Línea de referencia que se dibuja en las barras del ranking (‰). */
export const LINE_REFERENCE = 1.0;

const HOUR = 3_600_000;

/** Gramos de alcohol puro de X ml a Y % vol. */
export function gramsOf(ml: number, abv: number): number {
  return ml * (abv / 100) * ETHANOL_DENSITY;
}

/** Cuánto ‰ suma, como pico, esa cantidad de gramos para esta persona. */
export function bacFromGrams(grams: number, peso: number, sexo: Sexo): number {
  const r = R_FACTOR[sexo] ?? R_FACTOR.X;
  return grams / (peso * r);
}

/**
 * Alcohol en sangre estimado (‰) en un momento dado.
 * Cada trago sube de forma gradual durante ABSORPTION_MIN y el hígado
 * descuenta ELIMINATION_PER_HOUR desde el primer trago de la noche.
 */
export function bacAt(tragos: Trago[], profile: Profile, now: number = Date.now()): number {
  if (tragos.length === 0) return 0;

  let absorbed = 0;
  let first = Infinity;

  for (const t of tragos) {
    if (t.at > now) continue;
    first = Math.min(first, t.at);
    const progress = Math.min(1, (now - t.at) / (ABSORPTION_MIN * 60_000));
    absorbed += bacFromGrams(t.grams, profile.peso, profile.sexo) * progress;
  }

  if (!isFinite(first)) return 0;

  const eliminated = ((now - first) / HOUR) * ELIMINATION_PER_HOUR;
  return Math.max(0, absorbed - eliminated);
}

export interface BacBreakdown {
  /** Lo que ya está en sangre ahora mismo. */
  current: number;
  /** Lo que todavía se está absorbiendo (sube en los próximos minutos). */
  pending: number;
  /** Dónde va a llegar si no toma nada más. */
  peak: number;
}

/**
 * Igual que bacAt() pero además dice cuánto falta absorber, para poder
 * mostrar "0,42 ‰ · +0,39 subiendo" apenas se suma un trago.
 */
export function bacBreakdown(
  tragos: Trago[],
  profile: Profile,
  now: number = Date.now(),
): BacBreakdown {
  if (tragos.length === 0) return { current: 0, pending: 0, peak: 0 };

  let absorbed = 0;
  let total = 0;
  let first = Infinity;

  for (const t of tragos) {
    if (t.at > now) continue;
    first = Math.min(first, t.at);
    const full = bacFromGrams(t.grams, profile.peso, profile.sexo);
    const progress = Math.min(1, (now - t.at) / (ABSORPTION_MIN * 60_000));
    absorbed += full * progress;
    total += full;
  }

  if (!isFinite(first)) return { current: 0, pending: 0, peak: 0 };

  const eliminated = ((now - first) / HOUR) * ELIMINATION_PER_HOUR;
  const current = Math.max(0, absorbed - eliminated);
  const peak = Math.max(current, total - eliminated);

  return { current, pending: Math.max(0, peak - current), peak };
}

/** Lo mismo pero para un integrante del grupo (llega con gramos acumulados). */
export function bacOfMember(m: Member, now: number = Date.now()): number {
  const peak = bacFromGrams(m.grams, m.peso, m.sexo);
  const desde = m.startedAt || m.lastAt;
  const eliminated = ((now - desde) / HOUR) * ELIMINATION_PER_HOUR;
  return Math.max(0, peak - eliminated);
}

/** Horas hasta volver a cero. */
export function hoursToSober(bac: number): number {
  return bac / ELIMINATION_PER_HOUR;
}

/** Ritmo de las últimas 2 horas, en ‰/h. */
export function pacePerHour(tragos: Trago[], profile: Profile, now: number = Date.now()): number {
  const from = now - 2 * HOUR;
  const recent = tragos.filter((t) => t.at >= from);
  if (recent.length === 0) return 0;
  const span = Math.max(1, (now - Math.min(...recent.map((t) => t.at))) / HOUR);
  const sum = recent.reduce((a, t) => a + bacFromGrams(t.grams, profile.peso, profile.sexo), 0);
  return sum / span;
}

export interface Level {
  key: string;
  name: string;
  range: string;
  sub: string;
  color: string;
  gradient: string;
  /** Techo del tramo, para dibujar el progreso. */
  max: number;
}

export const LEVELS: Level[] = [
  {
    key: 'fresco',
    name: 'Fresco',
    range: '0 – 0,3',
    sub: 'Recién arrancás. La noche es larga.',
    color: '#C6F24E',
    gradient: 'linear-gradient(120deg,#C6F24E,#8fc41a)',
    max: 0.3,
  },
  {
    key: 'piola',
    name: 'Piola',
    range: '0,3 – 0,5',
    sub: 'Punto justo: hablás bien y bailás mejor.',
    color: '#C6F24E',
    gradient: 'linear-gradient(120deg,#C6F24E,#8fc41a)',
    max: 0.5,
  },
  {
    key: 'llamas',
    name: 'En llamas',
    range: '0,5 – 0,8',
    sub: 'Estás jugando el partido. Alterná con agua.',
    color: '#FFB020',
    gradient: 'linear-gradient(120deg,#FFB020,#E8402A)',
    max: 0.8,
  },
  {
    key: 'bajar',
    name: 'Bajá un cambio',
    range: '0,8 +',
    sub: 'Agua, algo salado y nada de manejar.',
    color: '#E8402A',
    gradient: 'linear-gradient(120deg,#E8402A,#a82415)',
    max: 99,
  },
];

export function levelOf(bac: number): Level {
  return LEVELS.find((l) => bac < l.max) ?? LEVELS[LEVELS.length - 1];
}

/** Equivalencia en "tragos estándar" (14 g de alcohol puro, criterio OMS/NIAAA). */
export const STANDARD_DRINK_G = 14;

export function standardDrinks(grams: number): number {
  return grams / STANDARD_DRINK_G;
}

/** Texto corto para mostrar debajo de un trago: "≈ 1,7 tragos estándar". */
export function kindEmojiLabel(kind: DrinkKind): string {
  const map: Record<DrinkKind, string> = {
    cerveza: 'Cerveza',
    vino: 'Vino',
    espumante: 'Espumante',
    sidra: 'Sidra',
    trago: 'Trago',
    shot: 'Shot',
  };
  return map[kind];
}
