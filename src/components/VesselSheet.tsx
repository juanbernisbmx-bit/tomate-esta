/**
 * Elegir vaso sin sacar foto: presets (Vaso de previa 1 L, Cerveza 1 L,
 * Trago, Shot…) y un editor a medida con ml y graduación.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { DRINK_TYPES, PRESETS, drinkType } from '../lib/catalog';
import { bacFromGrams, gramsOf } from '../lib/alcohol';
import { fmtAbv, fmtBac, fmtMl, uid } from '../lib/format';
import type { DrinkKind, Profile, Vessel } from '../lib/types';
import { Button, CheckIcon, GlassIcon, Sheet } from './ui';

const ML_STEPS = [45, 100, 150, 250, 330, 355, 473, 500, 750, 1000];

export function VesselSheet({
  open,
  onClose,
  current,
  profile,
  onPick,
  onPickAndAdd,
}: {
  open: boolean;
  onClose: () => void;
  current: Vessel;
  profile: Profile;
  onPick: (v: Vessel) => void;
  onPickAndAdd: (v: Vessel) => void;
}) {
  const [kind, setKind] = useState<DrinkKind | 'todos'>('todos');
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState(current.ml);
  const [customKind, setCustomKind] = useState<DrinkKind>(current.kind);
  const [customAbv, setCustomAbv] = useState(current.abv);

  const list = useMemo(
    () => (kind === 'todos' ? PRESETS : PRESETS.filter((p) => p.kind === kind)),
    [kind],
  );

  const custom: Vessel = {
    id: uid('v'),
    label: `${drinkType(customKind).label} ${fmtMl(customMl)}`,
    ml: customMl,
    kind: customKind,
    abv: customAbv,
    source: 'manual',
  };

  const deltaOf = (v: Vessel) => bacFromGrams(gramsOf(v.ml, v.abv), profile.peso, profile.sexo);

  return (
    <Sheet open={open} onClose={onClose} title="Elegí tu vaso">
      <div className="px-5">
        {/* Filtro por bebida */}
        <div className="-mx-5 flex gap-2 overflow-x-auto no-scrollbar px-5 pb-4">
          <Chip active={kind === 'todos'} onClick={() => setKind('todos')}>
            Todos
          </Chip>
          {DRINK_TYPES.map((d) => (
            <Chip key={d.id} active={kind === d.id} onClick={() => setKind(d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {list.map((p) => {
            const active = p.id === current.id;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                  active ? 'border-lime/50 bg-lime/10' : 'border-white/8 bg-surface'
                }`}
              >
                <button
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    onPick(p);
                    onClose();
                  }}
                >
                  <GlassIcon kind={p.kind} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-[19px] leading-none uppercase">
                        {p.label}
                      </span>
                      {active && <CheckIcon size={15} className="text-lime" />}
                    </div>
                    <div className="mt-1.5 truncate text-[11.5px] text-ink/55">
                      {fmtMl(p.ml)} · {fmtAbv(p.abv)} · +{fmtBac(deltaOf(p))} ‰
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onPickAndAdd(p);
                    onClose();
                  }}
                  className="flex-none rounded-full bg-lime px-3.5 py-2 text-[11px] font-semibold tracking-wider text-night active:bg-lime-dark"
                >
                  SUMAR
                </button>
              </div>
            );
          })}
        </div>

        {/* Vaso a medida */}
        <button
          onClick={() => setCustomOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-white/16 px-4 py-3.5 text-left"
        >
          <span className="font-display text-[18px] uppercase">Vaso a medida</span>
          <span className="text-[12px] text-ink/55">{customOpen ? 'Ocultar' : 'Abrir'}</span>
        </button>

        {customOpen && (
          <div className="mt-3 rounded-2xl border border-white/8 bg-surface p-4">
            <div className="text-[11px] font-medium tracking-[.18em] text-ink/55">BEBIDA</div>
            <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto no-scrollbar px-4">
              {DRINK_TYPES.map((d) => (
                <Chip
                  key={d.id}
                  active={customKind === d.id}
                  onClick={() => {
                    setCustomKind(d.id);
                    setCustomAbv(d.abv);
                  }}
                >
                  {d.label}
                </Chip>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-[.18em] text-ink/55">TAMAÑO</div>
              <div className="font-display text-[26px] leading-none text-lime tabular">
                {fmtMl(customMl)}
              </div>
            </div>
            <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto no-scrollbar px-4">
              {ML_STEPS.map((ml) => (
                <Chip key={ml} active={customMl === ml} onClick={() => setCustomMl(ml)}>
                  {fmtMl(ml)}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <StepBtn onClick={() => setCustomMl((v) => Math.max(15, v - 25))}>−</StepBtn>
              <input
                type="range"
                min={15}
                max={1500}
                step={5}
                value={customMl}
                onChange={(e) => setCustomMl(Number(e.target.value))}
                className="flex-1 accent-[#C6F24E]"
              />
              <StepBtn onClick={() => setCustomMl((v) => Math.min(1500, v + 25))}>+</StepBtn>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-[11px] font-medium tracking-[.18em] text-ink/55">GRADUACIÓN</div>
              <div className="font-display text-[22px] leading-none text-amber tabular">
                {fmtAbv(customAbv)}
              </div>
            </div>
            <input
              type="range"
              min={drinkType(customKind).abvRange[0]}
              max={drinkType(customKind).abvRange[1]}
              step={0.5}
              value={customAbv}
              onChange={(e) => setCustomAbv(Number(e.target.value))}
              className="mt-2.5 w-full accent-[#FFB020]"
            />

            <div className="mt-4 rounded-xl bg-night/60 px-3.5 py-3 text-[12px] text-ink/60">
              Suma <span className="text-ink">+{fmtBac(deltaOf(custom))} ‰</span> ·{' '}
              {Math.round(gramsOf(customMl, customAbv))} g de alcohol puro
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                variant="dark"
                size="sm"
                full
                onClick={() => {
                  onPick(custom);
                  onClose();
                }}
              >
                Dejarlo como mi vaso
              </Button>
              <Button
                size="sm"
                full
                onClick={() => {
                  onPickAndAdd(custom);
                  onClose();
                }}
              >
                Sumar trago
              </Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-none rounded-full px-3.5 py-2 text-[12.5px] font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-ink text-night' : 'border border-white/12 bg-surface text-ink/70'
      }`}
    >
      {children}
    </button>
  );
}

function StepBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="grid h-11 w-11 flex-none place-items-center rounded-full border border-white/14 bg-surface font-display text-[22px] leading-none"
    >
      {children}
    </button>
  );
}
