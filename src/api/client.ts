/** Frontend API contract. The backend, identity and authorization are external to this repository. */
import { ML_RANGE, PRESETS, drinkType } from '../lib/catalog';
import { initials, uid } from '../lib/format';
import type { DrinkKind, Group, Member, ScanResult, Trago } from '../lib/types';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const USING_MOCKS = !API_URL;
export const SCAN_MS = 1700;
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!response.ok) throw new Error(`La solicitud falló (${response.status}).`);
    if (response.status === 204) return undefined as T;
    const body = await response.text();
    return body ? (JSON.parse(body) as T) : (undefined as T);
  } finally {
    clearTimeout(timeout);
  }
}
/**
 * Login/registro: SOLO frontend por ahora. Con EXPO_PUBLIC_API_URL vacío nunca
 * pega a ningún backend real; simula una demora y devuelve éxito para poder
 * probar la pantalla. Cuando haya backend, alcanza con setear esa variable —
 * el contrato (`/api/auth/login`, `/api/auth/register`) ya está acá.
 */
export async function login(email: string, password: string): Promise<void> {
  if (API_URL) {
    await apiFetch<void>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 700));
}

export async function register(email: string, password: string): Promise<void> {
  if (API_URL) {
    await apiFetch<void>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 700));
}

/**
 * Avisa DENTRO de la app a los demás integrantes del grupo que alguien pidió
 * rescate. Igual que login/register: sin EXPO_PUBLIC_API_URL no llega a
 * nadie, solo simula la llamada. Para que esto notifique de verdad a otros
 * dispositivos hace falta backend + push notifications (Expo push tokens) —
 * no es algo que el frontend solo pueda resolver, por eso queda mockeado.
 */
export async function notifyRescue(
  groupCode: string,
  coords?: { latitude: number; longitude: number },
): Promise<void> {
  if (API_URL) {
    await apiFetch<void>(`/api/groups/${encodeURIComponent(groupCode)}/rescue`, {
      method: 'POST',
      body: JSON.stringify({ latitude: coords?.latitude, longitude: coords?.longitude }),
    });
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
}

export async function analyzeGlass(photo: string | null, kind: DrinkKind): Promise<ScanResult> {
  if (API_URL) {
    if (!photo) throw new Error('Sacá una foto o cargá las medidas manualmente.');
    const result = await apiFetch<ScanResult>('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ photo, kind }),
    });
    if (
      !result ||
      !Number.isFinite(result.ml) ||
      result.ml < ML_RANGE[0] ||
      result.ml > ML_RANGE[1] ||
      !Number.isFinite(result.abv) ||
      result.abv < 0 ||
      result.abv > 100 ||
      !Number.isFinite(result.confidence) ||
      result.confidence < 0 ||
      result.confidence > 100 ||
      typeof result.vesselLabel !== 'string' ||
      typeof result.note !== 'string'
    )
      throw new Error(
        'El análisis devolvió medidas inválidas. Intentá de nuevo o corregilas manualmente.',
      );
    return result;
  }
  await new Promise((resolve) => setTimeout(resolve, SCAN_MS));
  const base = PRESETS.find((p) => p.kind === kind);
  return {
    ml: base?.ml ?? 250,
    abv: drinkType(kind).abv,
    confidence: 0,
    vesselLabel: base?.label ?? drinkType(kind).label,
    note: 'Ejemplo simulado. No se analizó la imagen; revisá las medidas.',
  };
}
function mockMembers(now: number): Member[] {
  return [
    { name: 'Fer', grams: 22, peso: 82, tragos: 2, sexo: 'H' as const, color: '#FFB020' },
    { name: 'Sol', grams: 12, peso: 60, tragos: 1, sexo: 'M' as const, color: '#9B7BFF' },
    { name: 'Juli', grams: 0, peso: 68, tragos: 0, sexo: 'X' as const, color: '#5AC8FA' },
  ].map((m) => ({
    ...m,
    id: `demo-${m.name}`,
    ini: initials(m.name),
    startedAt: now - 3600000,
    lastAt: m.tragos ? now - 1200000 : 0,
    lastLabel: m.tragos ? 'Registro de ejemplo' : 'Sin registros',
  }));
}
function validateGroup(group: Group): Group {
  if (
    !group ||
    typeof group.code !== 'string' ||
    typeof group.name !== 'string' ||
    !Array.isArray(group.members) ||
    !group.members.every(
      (m) =>
        typeof m.id === 'string' &&
        typeof m.name === 'string' &&
        typeof m.ini === 'string' &&
        typeof m.color === 'string' &&
        Number.isFinite(m.grams) &&
        m.grams >= 0 &&
        Number.isFinite(m.peso) &&
        m.peso >= 40 &&
        m.peso <= 200 &&
        ['H', 'M', 'X'].includes(m.sexo) &&
        Number.isFinite(m.tragos) &&
        m.tragos >= 0 &&
        Number.isFinite(m.startedAt) &&
        Number.isFinite(m.lastAt) &&
        typeof m.lastLabel === 'string',
    )
  )
    throw new Error('El grupo recibido no es válido.');
  return group;
}
export async function fetchGroup(code: string): Promise<Group> {
  if (API_URL)
    return validateGroup(await apiFetch<Group>(`/api/groups/${encodeURIComponent(code)}`));
  await new Promise((resolve) => setTimeout(resolve, 350));
  return { code, name: 'Mi grupo demo', members: mockMembers(Date.now()) };
}
export async function createGroup(name: string): Promise<Group> {
  if (API_URL)
    return validateGroup(
      await apiFetch<Group>('/api/groups', { method: 'POST', body: JSON.stringify({ name }) }),
    );
  return { code: uid().slice(-4).toUpperCase(), name, members: [] };
}
export async function pollGroup(group: Group): Promise<Group> {
  return API_URL ? fetchGroup(group.code) : group;
}
export async function pushTrago(group: Group, trago: Trago): Promise<void> {
  if (API_URL)
    await apiFetch<void>(`/api/groups/${encodeURIComponent(group.code)}/tragos`, {
      method: 'POST',
      body: JSON.stringify(trago),
    });
}
