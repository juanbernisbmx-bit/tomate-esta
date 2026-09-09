import { useEffect, useMemo, useState } from 'react';
import { Kicker } from '../components/ui';
import { pollGroup } from '../api/client';
import { LINE_REFERENCE, bacFromGrams, pacePerHour } from '../lib/alcohol';
import { fmtAgo, fmtBac, fmtNum } from '../lib/format';
import { useActions, useApp } from '../state/store';
import { useLeaderboard, type Row } from '../state/selectors';

type Modo = 'ahora' | 'pico' | 'tragos';

const MODOS: Array<{ id: Modo; label: string }> = [
  { id: 'ahora', label: 'Ahora' },
  { id: 'pico', label: 'Pico' },
  { id: 'tragos', label: 'Tragos' },
];

export function Rank() {
  const { group, profile, tragos } = useApp();
  const { setGroup } = useActions();
  const { rows, promedio, totalTragos, now } = useLeaderboard();
  const [modo, setModo] = useState<Modo>('ahora');

  // Mientras mirás la tabla, el grupo se actualiza solo.
  useEffect(() => {
    if (!group) return;
    const id = setInterval(async () => setGroup(await pollGroup(group)), 45_000);
    return () => clearInterval(id);
  }, [group, setGroup]);

  const misGramos = tragos.reduce((a, t) => a + t.grams, 0);
  const miPico = bacFromGrams(misGramos, profile.peso, profile.sexo);

  const ordered = useMemo(() => {
    const withValue = rows.map((r) => ({
      row: r,
      valor:
        modo === 'ahora'
          ? r.bac
          : modo === 'tragos'
            ? r.tragos
            : r.me
              ? miPico
              : bacFromGrams(
                  group?.members.find((m) => m.id === r.id)?.grams ?? 0,
                  group?.members.find((m) => m.id === r.id)?.peso ?? 75,
                  group?.members.find((m) => m.id === r.id)?.sexo ?? 'H',
                ),
    }));
    return withValue.sort((a, b) => b.valor - a.valor);
  }, [rows, modo, group, miPico]);

  const max = Math.max(...ordered.map((o) => o.valor), modo === 'tragos' ? 4 : LINE_REFERENCE);
  const ritmo = pacePerHour(tragos, profile, now);

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar px-5 pt-16 pb-[130px]">
      <div className="flex items-baseline justify-between">
        <div className="font-display text-[34px] leading-none uppercase">La carrera</div>
        <div className="flex items-center gap-1.5 text-[11px] leading-none font-medium tracking-[.16em] text-lime">
          <span
            className="h-[7px] w-[7px] rounded-full bg-lime"
            style={{ animation: 'var(--animate-pulse-soft)' }}
          />
          EN VIVO
        </div>
      </div>
      <div className="mt-1.5 mb-3.5 text-[12.5px] leading-relaxed text-ink/60">
        {group?.name ?? 'Sin grupo'} · de 0 a la línea de {fmtNum(LINE_REFERENCE, 1)} ‰
      </div>

      <div className="mb-4 flex gap-1.5">
        {MODOS.map((m) => (
          <button
            key={m.id}
            onClick={() => setModo(m.id)}
            className={`rounded-full px-3.5 py-2 font-display text-[14px] leading-none uppercase transition-colors ${
              modo === m.id
                ? 'bg-ink text-night'
                : 'border border-white/14 bg-surface text-ink/70'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {ordered.map(({ row, valor }, i) => (
          <RankRow
            key={row.id}
            row={row}
            pos={i + 1}
            valor={valor}
            max={max}
            modo={modo}
            now={now}
          />
        ))}
      </div>

      <div className="mt-5 flex gap-2.5 border-t border-white/10 pt-3.5">
        <Foot value={`+${fmtBac(ritmo)}`} label="TU RITMO / H" color="#FFB020" />
        <Foot value={fmtBac(promedio)} label="PROMEDIO ‰" />
        <Foot value={totalTragos} label="TRAGOS GRUPO" />
      </div>

      <div className="mt-5 text-center text-[11.5px] leading-snug text-ink/50">
        Los números son estimaciones. El que maneja, no toma.
      </div>
    </div>
  );
}

function RankRow({
  row,
  pos,
  valor,
  max,
  modo,
  now,
}: {
  row: Row;
  pos: number;
  valor: number;
  max: number;
  modo: Modo;
  now: number;
}) {
  const width = `${Math.min(100, Math.round((valor / max) * 100))}%`;
  const fill = row.me
    ? '#C6F24E'
    : pos === 1
      ? 'linear-gradient(90deg,#FFB020,#E8402A)'
      : 'linear-gradient(90deg,#5a5138,#c8a13a)';

  return (
    <div
      className={`rounded-[14px] border px-3.5 ${row.me ? 'border-lime/32 bg-lime/8 py-3.5' : 'border-white/8 bg-surface py-3'}`}
    >
      <div className="mb-1.5 flex items-baseline gap-2.5">
        <span
          className="w-4 font-display text-[15px] leading-none"
          style={{ color: pos === 1 ? '#FFB020' : 'rgba(250,247,242,.62)' }}
        >
          {pos}
        </span>
        <span
          className="flex-1 font-display text-[19px] leading-none uppercase"
          style={{ color: row.me ? '#C6F24E' : '#FAF7F2' }}
        >
          {row.name}
        </span>
        <span className="text-[10.5px] leading-none font-medium whitespace-nowrap text-ink/60">
          {row.lastAt ? fmtAgo(row.lastAt, now) : '—'}
        </span>
        <span
          className="font-display text-[22px] leading-none tabular"
          style={{ color: row.me ? '#C6F24E' : pos === 1 ? '#FFB020' : '#FAF7F2' }}
        >
          {modo === 'tragos' ? valor : fmtBac(valor)}
        </span>
      </div>

      <div className="relative h-5 overflow-hidden rounded-md bg-[#171512]">
        <div
          className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-500"
          style={{ width, background: fill }}
        />
        {modo !== 'tragos' && (
          <div className="absolute inset-y-0 left-[80%] w-px bg-white/25" />
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] leading-snug text-ink/60">
        <span className="truncate">
          {row.lastLabel} · {row.tragos} {row.tragos === 1 ? 'trago' : 'tragos'}
        </span>
      </div>
    </div>
  );
}

function Foot({
  value,
  label,
  color,
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex-1">
      <div className="font-display text-[24px] leading-none tabular" style={{ color }}>
        {value}
      </div>
      <Kicker>{label}</Kicker>
    </div>
  );
}
