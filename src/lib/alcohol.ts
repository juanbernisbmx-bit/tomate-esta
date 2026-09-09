/**
 * Cálculo de alcohol en sangre (Widmark simplificado).
 *
 * Todo lo de acá es una ESTIMACIÓN orientativa: no reemplaza
 * un alcoholímetro ni sirve como prueba legal. Se documenta el modelo para
 * que el back pueda replicar exactamente los mismos números.
 */

import type { Member, Profile, Sexo, Trago } from './types';

/** Densidad del etanol (g/ml). */
export const ETHANOL_DENSITY = 0.789;

/** Factor de distribución corporal de Widmark, por sexo. */
export const R_FACTOR: Record<Sexo, number> = { H: 0.68, M: 0.55, X: 0.615 };

/** Eliminación hepática promedio, en % por hora. */
export const ELIMINATION_PER_HOUR = 0.15;

/** Tiempo de absorción de un trago (minutos): la suba no es instantánea. */
export const ABSORPTION_MIN = 20;

/** Línea de referencia que se dibuja en las barras del ranking (%). */
export const LINE_REFERENCE = 1.0;

const HOUR = 3_600_000;
const ABSORPTION_MS = ABSORPTION_MIN * 60_000;
const ELIMINATION_PER_MS = ELIMINATION_PER_HOUR / HOUR;

/** Gramos de alcohol puro de X ml a Y % vol. */
export function gramsOf(ml: number, abv: number): number {
  return ml * (abv / 100) * ETHANOL_DENSITY;
}

/** Cuánto % suma, como pico, esa cantidad de gramos para esta persona. */
export function bacFromGrams(grams: number, peso: number, sexo: Sexo): number {
  const r = R_FACTOR[sexo] ?? R_FACTOR.X;
  return grams / (peso * r);
}

/** Una dosis ya convertida al % de pico que aporta, con el instante en que se tomó. */
interface Dose {
  at: number;
  peak: number;
}

/**
 * Integra la curva de alcoholemia tramo por tramo.
 *
 * Los quiebres son cada toma y cada fin de absorción: entre dos quiebres
 * consecutivos la tasa de absorción no cambia, así que el % se mueve en línea
 * recta y alcanza con acotarlo a cero al cerrar cada tramo. Ese piso es lo que
 * distingue este modelo de restar una sola recta de eliminación sobre el total:
 * el hígado no sigue descontando sobre una alcoholemia que ya llegó a cero, así
 * que lo que se tome después de un bajón largo vuelve a contar entero.
 *
 * `current` es el % en `now`; `peak` es a dónde llega si no toma nada más;
 * `highest` es lo más alto que estuvo en toda la noche.
 */
function simulate(doses: Dose[], now: number): { current: number; peak: number; highest: number } {
  const taken = doses.filter((d) => d.at <= now && d.peak > 0 && Number.isFinite(d.at));
  if (taken.length === 0) return { current: 0, peak: 0, highest: 0 };

  const start = Math.min(...taken.map((d) => d.at));
  const marks = new Set<number>([start, now]);
  for (const d of taken) {
    marks.add(d.at);
    // Puede caer después de `now`: es lo que todavía tiene para subir.
    marks.add(d.at + ABSORPTION_MS);
  }
  const stops = [...marks].filter((t) => t >= start).sort((a, b) => a - b);

  let bac = 0;
  let current = 0;
  let peak = 0;
  let highest = 0;

  for (let i = 0; i < stops.length; i++) {
    const t = stops[i];
    if (t === now) current = bac;
    if (t >= now) peak = Math.max(peak, bac);
    // Dentro de cada tramo la curva es una recta, así que el máximo de la noche
    // cae siempre en un quiebre.
    highest = Math.max(highest, bac);

    const next = stops[i + 1];
    if (next === undefined) break;

    let absorbing = 0;
    for (const d of taken) if (d.at <= t && t < d.at + ABSORPTION_MS) absorbing += d.peak;
    const rate = absorbing / ABSORPTION_MS - ELIMINATION_PER_MS;
    bac = Math.max(0, bac + rate * (next - t));
  }

  const finalPeak = Math.max(peak, current);
  return { current, peak: finalPeak, highest: Math.max(highest, finalPeak) };
}

function dosesOf(tragos: Trago[], profile: Profile): Dose[] {
  return tragos.map((t) => ({
    at: t.at,
    peak: bacFromGrams(t.grams, profile.peso, profile.sexo),
  }));
}

/**
 * Alcohol en sangre estimado (%) en un momento dado.
 * Cada trago sube de forma gradual durante ABSORPTION_MIN y el hígado
 * descuenta ELIMINATION_PER_HOUR mientras quede alcohol en sangre.
 */
export function bacAt(tragos: Trago[], profile: Profile, now: number = Date.now()): number {
  return simulate(dosesOf(tragos, profile), now).current;
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
 * mostrar "0,42 % · +0,39 subiendo" apenas se suma un trago.
 */
export function bacBreakdown(
  tragos: Trago[],
  profile: Profile,
  now: number = Date.now(),
): BacBreakdown {
  const { current, peak } = simulate(dosesOf(tragos, profile), now);
  return { current, pending: Math.max(0, peak - current), peak };
}

/**
 * Lo mismo para un integrante del grupo, que llega con gramos acumulados en vez
 * de la lista de tragos: repartimos esos gramos en sus `tragos` tomas, repartidas
 * de `startedAt` a `lastAt`, y los pasamos por el mismo simulador. Es una
 * aproximación, pero usa la misma curva que el cálculo propio: con el mismo
 * consumo, peso y sexo, un integrante y vos dan el mismo número.
 */
export function bacOfMember(m: Member, now: number = Date.now()): number {
  return simulate(memberDoses(m), now).current;
}

function memberDoses(m: Member): Dose[] {
  const n = Math.max(0, Math.floor(m.tragos));
  const total = bacFromGrams(m.grams, m.peso, m.sexo);
  if (n === 0 || !(total > 0)) return [];
  const last = m.lastAt || m.startedAt;
  const first = m.startedAt || last;
  if (n === 1 || last <= first) return [{ at: last, peak: total }];
  const step = (last - first) / (n - 1);
  return Array.from({ length: n }, (_, i) => ({ at: first + i * step, peak: total / n }));
}

/**
 * Lo más alto que estuvo la estimación en toda la noche. El resumen guardaba en
 * su lugar el total de gramos convertido de una, sin descontar lo que el hígado
 * venía eliminando, así que archivaba un pico que nunca ocurrió.
 */
export function bacPeakOfNight(
  tragos: Trago[],
  profile: Profile,
  now: number = Date.now(),
): number {
  return simulate(dosesOf(tragos, profile), now).highest;
}

/** Horas hasta volver a cero. */
export function hoursToSober(bac: number): number {
  return bac / ELIMINATION_PER_HOUR;
}

/** Ritmo de las últimas 2 horas, en %/h. */
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
  /** Par que consume LinearGradient; RN no entiende cadenas CSS. */
  gradient: readonly [string, string];
  /** Techo del tramo, para dibujar el progreso. */
  max: number;
}

export const LEVELS: Level[] = [
  {
    key: 'fresco',
    name: 'Tu registro',
    range: '0 – 0,3',
    sub: 'Llevá tu registro y planificá la vuelta.',
    color: '#C6F24E',
    gradient: ['#C6F24E', '#91BB33'],
    max: 0.3,
  },
  {
    key: 'piola',
    name: 'Hacé una pausa',
    range: '0,3 – 0,5',
    sub: 'Alterná con agua. Si tomaste, no manejes.',
    color: '#E8E24A',
    gradient: ['#E8E24A', '#B5A82A'],
    max: 0.5,
  },
  {
    key: 'llamas',
    name: 'Cuidate',
    range: '0,5 – 0,8',
    sub: 'Evitá seguir tomando y buscá compañía.',
    color: '#FFB020',
    gradient: ['#FFB020', '#B85724'],
    max: 0.8,
  },
  {
    key: 'bajar',
    name: 'Bajá un cambio',
    range: '0,8 +',
    sub: 'Dejá de tomar. Pedí apoyo y no manejes.',
    color: '#E8402A',
    gradient: ['#E8402A', '#B85724'],
    max: 99,
  },
];

export function levelOf(bac: number): Level {
  return LEVELS.find((l) => bac < l.max) ?? LEVELS[LEVELS.length - 1];
}
