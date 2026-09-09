/** Cálculos derivados que usan varias pantallas. */

import { useMemo } from 'react';
import { bacAt, bacBreakdown, bacOfMember } from '../lib/alcohol';
import type { Group, Profile, Trago } from '../lib/types';
import { useApp, useNow } from './store';

export interface Row {
  id: string;
  name: string;
  ini: string;
  color: string;
  bac: number;
  tragos: number;
  lastAt: number;
  lastLabel: string;
  me: boolean;
}

export function buildRows(
  group: Group | null,
  profile: Profile,
  tragos: Trago[],
  now: number,
): Row[] {
  const last = tragos[tragos.length - 1];
  const me: Row = {
    id: 'me',
    name: profile.nombre || 'Vos',
    ini: 'YO',
    color: '#C6F24E',
    bac: bacAt(tragos, profile, now),
    tragos: tragos.length,
    lastAt: last?.at ?? 0,
    lastLabel: last?.label ?? 'Todavía nada',
    me: true,
  };

  const others: Row[] = (group?.members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    ini: m.ini,
    color: m.color,
    bac: bacOfMember(m, now),
    tragos: m.tragos,
    lastAt: m.lastAt,
    lastLabel: m.lastLabel,
    me: false,
  }));

  return [...others, me].sort((a, b) => b.bac - a.bac);
}

/** Tabla del grupo + mi posición, recalculadas con el reloj vivo. */
export function useLeaderboard() {
  const { group, profile, tragos } = useApp();
  const tick = useNow(15_000);

  return useMemo(() => {
    // El reloj avanza de a 15 s, así que un trago recién cargado podría quedar
    // "en el futuro" y no contarse. Tomamos siempre el instante más nuevo.
    const now = Math.max(tick, tragos[tragos.length - 1]?.at ?? 0);
    const rows = buildRows(group, profile, tragos, now);
    const myIndex = rows.findIndex((r) => r.me);
    const mine = rows[myIndex];
    const mio = bacBreakdown(tragos, profile, now);
    return {
      now,
      rows,
      puesto: myIndex + 1,
      total: rows.length,
      bac: mine?.bac ?? 0,
      /** Lo que todavía está subiendo (recién tomado). */
      subiendo: mio.pending,
      pico: mio.peak,
      promedio: rows.length ? rows.reduce((a, r) => a + r.bac, 0) / rows.length : 0,
      totalTragos: rows.reduce((a, r) => a + r.tragos, 0),
    };
  }, [group, profile, tragos, tick]);
}
