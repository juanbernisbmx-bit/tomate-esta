import { initialState, type AppState } from './model';
import { DRINK_TYPES } from '../lib/catalog';
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown, min = 0, max = Number.MAX_VALUE): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const text = (v: unknown): v is string => typeof v === 'string';
const sex = (v: unknown) => v === 'H' || v === 'M' || v === 'X';
const kind = (v: unknown) => DRINK_TYPES.some((d) => d.id === v);
const dose = (v: Record<string, unknown>) =>
  finite(v.ml, 1, 10000) && finite(v.abv, 0, 100) && kind(v.kind) && text(v.id) && text(v.label);

/** Whitelist persisted fields: navigation/toasts never survive a cold launch. */
export function decodeSavedState(raw: string | null): AppState {
  if (!raw) return initialState;
  try {
    const saved: unknown = JSON.parse(raw);
    if (!isObject(saved)) return initialState;
    const next = { ...initialState };
    const p = saved.profile;
    if (
      isObject(p) &&
      text(p.nombre) &&
      finite(p.peso, 40, 200) &&
      finite(p.edad, 18, 99) &&
      sex(p.sexo)
    ) {
      next.profile = p as unknown as AppState['profile'];
      next.onboarded = saved.onboarded === true;
    }
    const v = saved.vessel;
    if (isObject(v) && dose(v) && ['preset', 'scan', 'manual'].includes(String(v.source))) {
      next.vessel = {
        ...v,
        photo: text(v.photo) ? v.photo : undefined,
      } as unknown as AppState['vessel'];
    }
    if (Array.isArray(saved.tragos))
      next.tragos = saved.tragos.filter(
        (t) =>
          isObject(t) &&
          dose(t) &&
          finite(t.at) &&
          finite(t.grams) &&
          ['boton', 'scan', 'preset'].includes(String(t.via)),
      );
    if (Array.isArray(saved.history))
      next.history = saved.history
        .filter(
          (h) =>
            isObject(h) &&
            text(h.id) &&
            finite(h.closedAt) &&
            finite(h.peakBac) &&
            finite(h.tragos) &&
            finite(h.grams),
        )
        .slice(0, 30);
    const g = saved.group;
    if (
      isObject(g) &&
      text(g.code) &&
      text(g.name) &&
      Array.isArray(g.members) &&
      g.members.every(
        (m) =>
          isObject(m) &&
          text(m.id) &&
          text(m.name) &&
          text(m.ini) &&
          text(m.color) &&
          finite(m.grams) &&
          finite(m.peso, 40, 200) &&
          sex(m.sexo) &&
          finite(m.tragos) &&
          finite(m.startedAt) &&
          finite(m.lastAt) &&
          text(m.lastLabel),
      )
    ) {
      next.group = g as unknown as AppState['group'];
    }
    next.screen = next.onboarded ? 'home' : 'welcome';
    return next;
  } catch {
    return initialState;
  }
}
export function serializeState({ screen: _screen, toast: _toast, ...saved }: AppState): string {
  return JSON.stringify(saved);
}
/** Serialize writes so slow storage cannot overwrite a newer state or a reset. */
export function createWriteQueue(write: (raw: string) => Promise<void>) {
  let tail = Promise.resolve();
  return (raw: string) => {
    const result = tail.catch(() => {}).then(() => write(raw));
    tail = result;
    return result;
  };
}
