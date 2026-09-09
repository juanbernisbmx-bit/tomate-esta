/**
 * Capa de datos. HOY todo es mock local; cuando exista el back sólo hay que
 * cambiar el cuerpo de estas funciones (la firma ya es la definitiva).
 *
 *   POST /api/scan          { photo, kind }        -> ScanResult
 *   GET  /api/groups/:code                         -> Group
 *   POST /api/groups/:code/tragos  { trago }       -> Member[]
 *
 * Para apuntar al back real: definir VITE_API_URL en .env y usar apiFetch().
 */

import { PRESETS } from '../lib/catalog';
import { gramsOf } from '../lib/alcohol';
import { initials, uid } from '../lib/format';
import type { DrinkKind, Group, Member, ScanResult, Trago } from '../lib/types';

export const API_URL = import.meta.env.VITE_API_URL ?? '';

export const USING_MOCKS = !API_URL;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Duración del "analizando…" en el mock. */
export const SCAN_MS = 1700;

/**
 * Analiza la foto del vaso. La persona ya eligió QUÉ está tomando, así que
 * la IA sólo tiene que estimar el recipiente y el volumen.
 */
export async function analyzeGlass(photo: string | null, kind: DrinkKind): Promise<ScanResult> {
  if (API_URL) {
    return apiFetch<ScanResult>('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ photo, kind }),
    });
  }

  await wait(SCAN_MS);

  // Mock: elegimos un recipiente plausible para esa bebida y le metemos ruido,
  // igual que haría una estimación real de volumen.
  const candidates = PRESETS.filter((p) => p.kind === kind);
  const base = candidates[Math.floor(Math.random() * candidates.length)] ?? PRESETS[2];
  const jitter = 1 + (Math.random() * 0.24 - 0.12); // ±12 %
  const ml = Math.round((base.ml * jitter) / 5) * 5;
  const confidence = Math.round(84 + Math.random() * 14);

  return {
    ml,
    abv: base.abv,
    confidence,
    vesselLabel: base.label,
    note: llenadoNote(),
  };
}

function llenadoNote(): string {
  const notes = [
    'Vaso lleno hasta el borde',
    'Vaso casi lleno, con hielo',
    'Tres cuartos de vaso',
    'Vaso servido al ras',
    'Botella medida por la etiqueta',
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

/** Integrantes de mentira para poder ver la tabla funcionando. */
function mockMembers(now: number): Member[] {
  const seed: Array<[string, string, number, number, number, number, string]> = [
    // nombre, color, gramos, peso, tragos, hace cuántos minutos, último trago
    ['Fer', '#FFB020', 78, 82, 6, 8, 'Fernet vaso largo'],
    ['Nacho', '#E8402A', 52, 76, 4, 21, 'Pinta IPA'],
    ['Sol', '#9B7BFF', 33, 60, 3, 34, 'Gin tonic'],
    ['Juli', '#5AC8FA', 11, 68, 1, 70, 'Porrón'],
  ];
  return seed.map(([name, color, grams, peso, tragos, mins, last]) => ({
    id: uid('m'),
    name,
    ini: initials(name),
    color,
    grams,
    peso,
    sexo: name === 'Sol' ? 'M' : 'H',
    tragos,
    startedAt: now - 3 * 60 * 60_000,
    lastAt: now - mins * 60_000,
    lastLabel: last,
  }));
}

export async function fetchGroup(code: string): Promise<Group> {
  if (API_URL) return apiFetch<Group>(`/api/groups/${code}`);
  await wait(500);
  return { code, name: 'Los Pibes', members: mockMembers(Date.now()) };
}

/**
 * Avanza a los otros integrantes para que la tabla se sienta viva.
 * Con el back real esto lo reemplaza un websocket o un poll.
 */
export async function pollGroup(group: Group): Promise<Group> {
  if (API_URL) return apiFetch<Group>(`/api/groups/${group.code}`);
  const now = Date.now();
  const members = group.members.map((m) => {
    // ~35 % de chance de que alguien se haya mandado otro trago
    if (Math.random() > 0.35) return m;
    const extra = gramsOf(300 + Math.random() * 400, 5 + Math.random() * 8);
    return { ...m, grams: m.grams + extra, tragos: m.tragos + 1, lastAt: now };
  });
  return { ...group, members };
}

export async function pushTrago(group: Group, trago: Trago): Promise<void> {
  if (API_URL) {
    await apiFetch(`/api/groups/${group.code}/tragos`, {
      method: 'POST',
      body: JSON.stringify(trago),
    });
  }
  // Mock: no hace falta hacer nada, el estado local ya lo tiene.
}
