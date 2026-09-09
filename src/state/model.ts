import { DEFAULT_VESSEL } from '../lib/catalog';
import { uid } from '../lib/format';
import type { Group, Profile, Screen, Trago, Vessel } from '../lib/types';

export interface NightSummary {
  id: string;
  closedAt: number;
  peakBac: number;
  tragos: number;
  grams: number;
  puesto?: number; // Legado: no se muestra ni se usa para premiar consumo.
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
  toast: { id: string; text: string; undoId?: string; hint?: string } | null;
}

export const initialState: AppState = {
  screen: 'welcome',
  onboarded: false,
  profile: { nombre: 'Vos', peso: 70, edad: 24, sexo: 'H' },
  group: null,
  vessel: DEFAULT_VESSEL,
  tragos: [],
  history: [],
  toast: null,
};

export type Action =
  | { type: 'screen'; screen: Screen }
  | { type: 'profile'; patch: Partial<Profile> }
  | { type: 'onboarded' }
  | { type: 'group'; group: Group | null }
  | { type: 'vessel'; vessel: Vessel }
  | { type: 'addTrago'; trago: Trago }
  | { type: 'undoTrago'; id: string }
  | { type: 'closeNight'; summary: NightSummary }
  | { type: 'toast'; text: string | null; undoId?: string; hint?: string }
  | { type: 'hydrate'; state: Partial<AppState> }
  | { type: 'reset' };

export function reducer(state: AppState, action: Action): AppState {
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
        toast: action.text
          ? { id: uid('t'), text: action.text, undoId: action.undoId, hint: action.hint }
          : null,
      };
    case 'hydrate':
      return { ...state, ...action.state };
    case 'reset':
      return { ...initialState, screen: 'welcome' };
    default:
      return state;
  }
}
