import { useState } from 'react';
import { Button, CameraIcon, GlassIcon, Kicker, PlusIcon, Stat } from '../components/ui';
import { VesselSheet } from '../components/VesselSheet';
import { FEATURED_PRESETS } from '../lib/catalog';
import { LEVELS, bacFromGrams, gramsOf, hoursToSober, levelOf } from '../lib/alcohol';
import { fmtAbv, fmtAgo, fmtBac, fmtClock, fmtHours, fmtMl } from '../lib/format';
import type { Vessel } from '../lib/types';
import { useActions, useApp } from '../state/store';
import { useLeaderboard } from '../state/selectors';

export function Home() {
  const { profile, group, vessel, tragos } = useApp();
  const { go, setVessel, addTrago, showToast } = useActions();
  const { bac, subiendo, puesto, total, now } = useLeaderboard();
  const [sheet, setSheet] = useState(false);

  const level = levelOf(bac);
  const delta = bacFromGrams(gramsOf(vessel.ml, vessel.abv), profile.peso, profile.sexo);
  const last = tragos[tragos.length - 1];

  /** El botón grande: suma el vaso predeterminado tal cual está. */
  const sumar = (v: Vessel = vessel, via: 'boton' | 'preset' = 'boton') => {
    const t = addTrago(v, via);
    const suma = bacFromGrams(t.grams, profile.peso, profile.sexo);
    showToast(`+1 ${v.label} · +${fmtBac(suma)} ‰`, t.id);
  };

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar px-5 pt-16 pb-[130px]">
      <header className="mb-4 flex items-center justify-between">
        <div className="font-display text-[24px] leading-none uppercase">
          {group?.name ?? 'Sin grupo'}
        </div>
        <div className="text-[12px] leading-none font-medium tracking-[.14em] text-ink/60 tabular">
          {fmtClock(now)}
        </div>
      </header>

      <Kicker>Estás en</Kicker>
      <div
        className="mt-2.5 rounded-[18px] px-4 py-4.5 text-night"
        style={{ background: level.gradient }}
      >
        <div className="font-display text-[40px] leading-[.95] uppercase">{level.name}</div>
        <div className="mt-2 flex items-end justify-between">
          <div className="max-w-[180px] text-[12px] leading-snug font-medium">{level.sub}</div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-display text-[42px] leading-none tabular">{fmtBac(bac)}</span>
              <span className="text-[12px] leading-none font-medium">‰</span>
            </div>
            {subiendo > 0.005 && (
              <div className="mt-1 inline-block rounded-full bg-night/25 px-2 py-1 text-[10.5px] leading-none font-semibold tracking-wide">
                +{fmtBac(subiendo)} SUBIENDO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* La escalera de niveles, compacta: dónde estás y qué viene */}
      <div className="mt-2.5">
        <div className="flex gap-1">
          {LEVELS.map((l) => {
            const on = l.key === level.key;
            return (
              <div
                key={l.key}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: on ? level.color : 'rgba(250,247,242,.12)' }}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-1">
          {LEVELS.map((l) => {
            const on = l.key === level.key;
            return (
              <div
                key={l.key}
                className="flex-1 text-center text-[9px] leading-tight font-medium tracking-wide uppercase"
                style={{ color: on ? level.color : 'rgba(250,247,242,.38)' }}
              >
                {l.name}
                <div className="text-[8.5px] opacity-70">{l.range}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <Stat value={tragos.length} label="TRAGOS" />
        <Stat value={`#${puesto}`} label={`DE ${total}`} />
        <Stat value={fmtHours(hoursToSober(bac + subiendo))} label="A CERO" />
      </div>

      {/* ── Mi vaso: lo que suma el botón grande ─────────────────── */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-surface p-4">
        <div className="flex items-center justify-between">
          <Kicker>Mi vaso</Kicker>
          <button
            onClick={() => setSheet(true)}
            className="rounded-full border border-white/14 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-ink/70 active:text-ink"
          >
            CAMBIAR
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3.5">
          {vessel.photo ? (
            <img
              src={vessel.photo}
              alt=""
              className="h-[54px] w-[54px] flex-none rounded-xl object-cover"
            />
          ) : (
            <GlassIcon kind={vessel.kind} size={50} />
          )}
          <div className="min-w-0 flex-1">
            <div
              className={`truncate font-display leading-none uppercase ${
                vessel.label.length > 15 ? 'text-[20px]' : 'text-[26px]'
              }`}
            >
              {vessel.label}
            </div>
            <div className="mt-1.5 text-[12px] text-ink/60">
              {fmtMl(vessel.ml)} · {fmtAbv(vessel.abv)}
              {vessel.source === 'scan' && vessel.confidence
                ? ` · IA ${vessel.confidence} %`
                : ''}
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="font-display text-[24px] leading-none text-lime tabular">
              +{fmtBac(delta)}
            </div>
            <div className="text-[10px] font-medium tracking-[.12em] text-ink/50">‰ POR TRAGO</div>
          </div>
        </div>
      </div>

      {/* ── Los dos botones ──────────────────────────────────────── */}
      <div className="mt-3 flex flex-col gap-2.5">
        <Button
          size="lg"
          full
          onClick={() => sumar()}
          className="flex items-center justify-center gap-2.5"
        >
          <PlusIcon size={22} className="-mt-0.5" />
          Sumar trago
        </Button>

        <Button
          size="md"
          full
          variant="dark"
          onClick={() => go('scan')}
          className="flex items-center justify-center gap-2.5 text-amber"
        >
          <CameraIcon size={20} />
          Escanear vaso con IA
        </Button>
      </div>

      {/* Presets rápidos: tocar uno lo deja como tu vaso */}
      <div className="mt-5">
        <Kicker>Sin foto</Kicker>
        <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto no-scrollbar px-5">
          {FEATURED_PRESETS.map((p) => {
            const on = p.id === vessel.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setVessel(p);
                  showToast(`Tu vaso ahora es ${p.label}`);
                }}
                className={`flex-none rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                  on ? 'border-lime/50 bg-lime/10' : 'border-white/10 bg-surface'
                }`}
              >
                <div className="font-display text-[15px] leading-none uppercase whitespace-nowrap">
                  {p.label}
                </div>
                <div className="mt-1.5 text-[11px] whitespace-nowrap text-ink/55">
                  {fmtMl(p.ml)} · {fmtAbv(p.abv)}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setSheet(true)}
            className="flex-none rounded-2xl border border-dashed border-white/18 px-4 py-3 font-display text-[15px] uppercase text-ink/70"
          >
            Ver todos
          </button>
        </div>
      </div>

      {/* Últimos tragos */}
      {tragos.length > 0 && (
        <div className="mt-6">
          <Kicker>La noche hasta ahora</Kicker>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {[...tragos]
              .reverse()
              .slice(0, 6)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-[13px] border border-white/8 bg-surface px-3.5 py-2.5"
                >
                  <GlassIcon kind={t.kind} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{t.label}</div>
                    <div className="text-[11px] text-ink/50">
                      {fmtMl(t.ml)} · {Math.round(t.grams)} g
                    </div>
                  </div>
                  <div className="flex-none text-[11px] text-ink/50">{fmtAgo(t.at, now)}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-[11.5px] leading-snug text-ink/55">
        {last ? `Último: ${last.label} · ${fmtAgo(last.at, now)}` : 'Todavía no sumaste nada'}
        <br />
        Tomá agua · guardá el auto
      </div>

      <VesselSheet
        open={sheet}
        onClose={() => setSheet(false)}
        current={vessel}
        profile={profile}
        onPick={(v) => {
          setVessel(v);
          showToast(`Tu vaso ahora es ${v.label}`);
        }}
        onPickAndAdd={(v) => {
          setVessel(v);
          sumar(v, 'preset');
        }}
      />
    </div>
  );
}
