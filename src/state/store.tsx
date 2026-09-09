/**
 * Estado global de la app: perfil, grupo, vaso predeterminado y tragos.
 * Se persiste en AsyncStorage para que cerrar la app no borre la noche.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState as NativeAppState, ActivityIndicator, Pressable, Text, View } from 'react-native';
import { initialState, reducer, type AppState, type NightSummary } from './model';
import { decodeSavedState, serializeState, createWriteQueue } from './persistence';
export type { AppState, NightSummary } from './model';
import { gramsOf } from '../lib/alcohol';
import { uid } from '../lib/format';
import type { Group, Profile, Screen, Trago, Vessel } from '../lib/types';

const STORAGE_KEY = 'tomate.v1';

const enqueueWrite = createWriteQueue((raw) => AsyncStorage.setItem(STORAGE_KEY, raw));

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
  showToast: (text: string, undoId?: string, hint?: string) => void;
  hideToast: () => void;
  reset: () => void;
}

const StateCtx = createContext<AppState>(initialState);
const ActionsCtx = createContext<AppActions | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [readError, setReadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setReadError(false);
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (active) {
          dispatch({ type: 'hydrate', state: decodeSavedState(raw) });
          setHydrated(true);
        }
      })
      .catch(() => {
        // Do not write defaults over data we could not read.
        if (active) setReadError(true);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  // Referencia viva al estado: deja que addTrago() sin argumentos use el vaso
  // actual sin tener que recrear el objeto de acciones en cada render.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!hydrated) return;
    enqueueWrite(serializeState(state)).catch(() => {
      dispatch({
        type: 'toast',
        text: 'No se guardaron los últimos cambios. Revisá el espacio disponible.',
      });
    });
  }, [
    hydrated,
    state.onboarded,
    state.profile,
    state.group,
    state.vessel,
    state.tragos,
    state.history,
  ]);

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
      showToast: (text, undoId, hint) => dispatch({ type: 'toast', text, undoId, hint }),
      hideToast: () => dispatch({ type: 'toast', text: null }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [],
  );

  if (!hydrated)
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0908', justifyContent: 'center' }}>
        {readError ? (
          <View style={{ padding: 32, gap: 20 }}>
            <Text accessibilityRole="alert" style={{ color: '#FAF7F2', fontSize: 16 }}>
              No pudimos recuperar tus datos. Volvé a intentar para abrir tu registro.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setLoadAttempt((n) => n + 1)}
              style={{ minHeight: 48, padding: 14, backgroundColor: '#C6F24E', borderRadius: 24 }}
            >
              <Text style={{ textAlign: 'center' }}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <ActivityIndicator color="#C6F24E" accessibilityLabel="Cargando tus datos" />
        )}
      </View>
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
    const subscription = NativeAppState.addEventListener('change', (status) => {
      if (status === 'active') tick();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [intervalMs]);
  return now;
}
