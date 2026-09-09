/**
 * Estado global de la app: perfil, grupo, vaso predeterminado y tragos.
 * Se persiste en localStorage para que cerrar la app no borre la noche.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { DEFAULT_VESSEL } from '../lib/catalog';
import { gramsOf } from '../lib/alcohol';
import { uid } from '../lib/format';
import type { Group, Profile, Screen, Trago, Vessel } from '../lib/types';

const STORAGE_KEY = 'tomate.v1';

export interface NightSummary {
  id: string;
  closedAt: number;
  peakBac: number;
  tragos: number;
  grams: number;
  puesto: number;
}

export interface AppState {
  screen: Screen;
  onboarded: boolean;
  profile: Profile;
  group: Group | null;
  /** El vaso que suma el botón "Sumar trago". */
  vessel: Vessel;
  tragos: Trago[];
  history: NightSummary[];
  toast: { id: string; text: string; undoId?: string } | null;
}

const initialState: AppState = {
  screen: 'welcome',
  onboarded: false,
  profile: { nombre: 'Vos', peso: 78, edad: 24, sexo: 'H' },
  group: null,
  vessel: DEFAULT_VESSEL,
  tragos: [],
  history: [],
  toast: null,
};

type Action =
  | { type: 'screen'; screen: Screen }
  | { type: 'profile'; patch: Partial<Profile> }
  | { type: 'onboarded' }
  | { type: 'group'; group: Group | null }
  | { type: 'vessel'; vessel: Vessel }
  | { type: 'addTrago'; trago: Trago }
  | { type: 'undoTrago'; id: string }
  | { type: 'closeNight'; summary: NightSummary }
  | { type: 'toast'; text: string | null; undoId?: string }
  | { type: 'hydrate'; state: Partial<AppState> }
  | { type: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'screen':
      return { ...state, screen: action.screen };
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.patch } };
    case 'onboarded':
      return { ...state, onboarded: true };
    case 'group':
      return { ...state, group: action.group };
    case 'vessel':
      return { ...state, vessel: action.vessel };
    case 'addTrago':
      return { ...state, tragos: [...state.tragos, action.trago] };
    case 'undoTrago':
      return { ...state, tragos: state.tragos.filter((t) => t.id !== action.id) };
    case 'closeNight':
      return { ...state, tragos: [], history: [action.summary, ...state.history].slice(0, 30) };
    case 'toast':
      return {
        ...state,
        toast: action.text ? { id: uid('t'), text: action.text, undoId: action.undoId } : null,
      };
    case 'hydrate':
      return { ...state, ...action.state };
    case 'reset':
      return { ...initialState, screen: 'welcome' };
    default:
      return state;
  }
}

function load(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<AppState>;
    // La pantalla se recalcula en el arranque, no se restaura tal cual.
    delete saved.screen;
    delete saved.toast;
    return saved;
  } catch {
    return null;
  }
}

function save(state: AppState) {
  try {
    const { screen: _screen, toast: _toast, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* modo privado o storage lleno: seguimos sin persistir */
  }
}

export interface AppActions {
  go: (screen: Screen) => void;
  setProfile: (patch: Partial<Profile>) => void;
  finishOnboarding: () => void;
  setGroup: (group: Group | null) => void;
  /** Deja este vaso como predeterminado (lo que suma el botón grande). */
  setVessel: (vessel: Vessel) => void;
  /** Suma un trago. Sin argumento usa el vaso predeterminado. */
  addTrago: (vessel?: Vessel, via?: Trago['via']) => Trago;
  undoTrago: (id: string) => void;
  closeNight: (summary: Omit<NightSummary, 'id' | 'closedAt'>) => void;
  showToast: (text: string, undoId?: string) => void;
  hideToast: () => void;
  reset: () => void;
}

const StateCtx = createContext<AppState>(initialState);
const ActionsCtx = createContext<AppActions | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => {
    const saved = load();
    if (!saved) return base;
    const merged = { ...base, ...saved };
    // Si ya se onboardeó y tiene grupo, entra directo al home.
    merged.screen = merged.onboarded && merged.group ? 'home' : 'welcome';
    return merged;
  });

  // Referencia viva al estado: deja que addTrago() sin argumentos use el vaso
  // actual sin tener que recrear el objeto de acciones en cada render.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    save(state);
  }, [state]);

  const actions = useMemo<AppActions>(
    () => ({
      go: (screen) => dispatch({ type: 'screen', screen }),
      setProfile: (patch) => dispatch({ type: 'profile', patch }),
      finishOnboarding: () => dispatch({ type: 'onboarded' }),
      setGroup: (group) => dispatch({ type: 'group', group }),
      setVessel: (vessel) => dispatch({ type: 'vessel', vessel }),
      addTrago: (vessel, via = 'boton') => {
        const v = vessel ?? stateRef.current.vessel;
        const trago: Trago = {
          id: uid('tr'),
          at: Date.now(),
          label: v.label,
          ml: v.ml,
          kind: v.kind,
          abv: v.abv,
          grams: gramsOf(v.ml, v.abv),
          via,
        };
        dispatch({ type: 'addTrago', trago });
        return trago;
      },
      undoTrago: (id) => dispatch({ type: 'undoTrago', id }),
      closeNight: (summary) =>
        dispatch({
          type: 'closeNight',
          summary: { ...summary, id: uid('n'), closedAt: Date.now() },
        }),
      showToast: (text, undoId) => dispatch({ type: 'toast', text, undoId }),
      hideToast: () => dispatch({ type: 'toast', text: null }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [],
  );

  return (
    <StateCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useApp(): AppState {
  return useContext(StateCtx);
}

export function useActions(): AppActions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error('useActions fuera de <AppProvider>');
  return ctx;
}

/** Reloj compartido: hace que el ‰ baje solo sin re-renderizar de más. */
export function useNow(intervalMs = 20_000): number {
  const [now, tick] = useReducer(() => Date.now(), Date.now());
  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
