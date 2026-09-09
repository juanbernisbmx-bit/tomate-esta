import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, GlassIcon, Kicker } from '../components/ui';
import { analyzeGlass } from '../api/client';
import { DRINK_TYPES, drinkType } from '../lib/catalog';
import { bacFromGrams, gramsOf, levelOf } from '../lib/alcohol';
import { fmtAbv, fmtBac, fmtMl, uid } from '../lib/format';
import type { DrinkKind, ScanResult, Vessel } from '../lib/types';
import { useActions, useApp } from '../state/store';
import { useLeaderboard } from '../state/selectors';

type Phase = 'kind' | 'camera' | 'analyzing' | 'result';

export function Scan() {
  const { profile, vessel } = useApp();
  const { go, setVessel, addTrago, showToast } = useActions();

  const [phase, setPhase] = useState<Phase>('kind');
  const [kind, setKind] = useState<DrinkKind>(vessel.kind);
  const [abv, setAbv] = useState(vessel.abv);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [ml, setMl] = useState(vessel.ml);
  const [camError, setCamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Cámara trasera mientras estamos en la pantalla de encuadre.
  useEffect(() => {
    if (phase !== 'camera') return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) setCamError('Sin cámara: igual podés estimar el vaso.');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [phase, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  /** Congela un cuadro del video y se lo manda a la IA. */
  const shoot = async () => {
    const video = videoRef.current;
    let dataUrl: string | null = null;

    if (video && video.videoWidth) {
      const w = 640;
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(video, 0, 0, w, h);
      dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    }

    setPhoto(dataUrl);
    setPhase('analyzing');
    stopCamera();

    const r = await analyzeGlass(dataUrl, kind);
    const [min, max] = drinkType(kind).abvRange;
    setResult(r);
    setMl(r.ml);
    setAbv(Math.min(max, Math.max(min, r.abv)));
    setPhase('result');
  };

  if (phase === 'kind') {
    return (
      <KindStep
        kind={kind}
        onPick={(k) => {
          setKind(k);
          setAbv(drinkType(k).abv);
        }}
        onNext={() => setPhase('camera')}
        onCancel={() => go('home')}
      />
    );
  }

  if (phase === 'result' && result) {
    return (
      <ResultStep
        result={result}
        photo={photo}
        kind={kind}
        ml={ml}
        abv={abv}
        setMl={setMl}
        setAbv={setAbv}
        onRetry={() => {
          setResult(null);
          setPhase('camera');
        }}
        onSave={(add) => {
          const v: Vessel = {
            id: uid('v'),
            label: result.vesselLabel,
            ml,
            kind,
            abv,
            source: 'scan',
            photo: photo ?? undefined,
            confidence: result.confidence,
            hint: result.note,
          };
          setVessel(v);
          if (add) {
            const t = addTrago(v, 'scan');
            const suma = bacFromGrams(t.grams, profile.peso, profile.sexo);
            showToast(`${v.label} es tu vaso · +${fmtBac(suma)} ‰`, t.id);
          } else {
            showToast(`Tu vaso ahora es ${v.label}`);
          }
          go('home');
        }}
      />
    );
  }

  // Encuadre + análisis
  return (
    <div className="flex h-full flex-col bg-[#050505] px-5 pt-16 pb-8">
      <div className="font-display text-[30px] leading-none uppercase">Foto al trago</div>
      <div className="mt-1.5 mb-4 text-[13px] leading-relaxed text-ink/65">
        Encuadrá el vaso completo. La IA estima el tamaño y lo cruza con{' '}
        <span className="text-ink">{drinkType(kind).label.toLowerCase()}</span>.
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-[#241d14] to-[#0b0a09]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {camError && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative h-[210px] w-[120px]">
              <div className="absolute inset-0 rounded-t-[10px] rounded-b-[26px] border border-white/16 bg-white/6" />
              <div className="absolute inset-x-1.5 bottom-1.5 h-[62%] rounded-t-md rounded-b-[22px] bg-gradient-to-b from-amber-dark to-[#7a4a05]" />
            </div>
          </div>
        )}

        {/* Marco de escaneo */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-x-0 h-[120px] bg-gradient-to-b from-transparent via-lime/16 to-transparent"
            style={{ animation: 'var(--animate-scan)' }}
          />
          <Corner className="top-3.5 left-3.5 border-t-2 border-l-2" />
          <Corner className="top-3.5 right-3.5 border-t-2 border-r-2" />
          <Corner className="bottom-3.5 left-3.5 border-b-2 border-l-2" />
          <Corner className="bottom-3.5 right-3.5 border-r-2 border-b-2" />
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-night/70 px-3 py-1.5 text-[10.5px] leading-none font-medium tracking-[.14em] text-lime">
            {camError ? 'MODO ESTIMACIÓN' : 'ENCUADRÁ EL VASO'}
          </div>
        </div>

        {phase === 'analyzing' && (
          <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-[#050505]/75 p-5.5">
            <div
              className="text-[11px] leading-none font-medium tracking-[.2em] text-lime"
              style={{ animation: 'var(--animate-pulse-soft)' }}
            >
              ANALIZANDO…
            </div>
            <div className="text-[13px] leading-relaxed">
              Midiendo el vaso · estimando volumen · calculando alcohol puro
            </div>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {[drinkType(kind).label, fmtAbv(abv), 'VOLUMEN POR IA'].map((t) => (
          <div
            key={t}
            className="rounded-full border border-white/14 bg-surface px-3 py-2 text-[11px] leading-none font-medium tracking-[.1em] text-ink/75 uppercase"
          >
            {t}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => go('home')}
          className="p-2.5 text-[12px] font-medium tracking-[.1em] text-ink/60"
        >
          CANCELAR
        </button>
        <button
          aria-label="Sacar foto"
          disabled={phase === 'analyzing'}
          onClick={shoot}
          className="h-[74px] w-[74px] rounded-full border-4 border-white/85 bg-amber active:scale-95 disabled:opacity-50"
        />
        <button
          onClick={() => setPhase('kind')}
          className="p-2.5 text-[12px] font-medium tracking-[.1em] text-ink/60"
        >
          BEBIDA
        </button>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <div className={`absolute h-[26px] w-[26px] border-lime ${className}`} />;
}

/* ── Paso 1: qué estás tomando ─────────────────────────────────── */

function KindStep({
  kind,
  onPick,
  onNext,
  onCancel,
}: {
  kind: DrinkKind;
  onPick: (k: DrinkKind) => void;
  onNext: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-6 pt-16 pb-10">
      <Kicker color="#FFB020">Paso 1 de 2</Kicker>
      <div className="mt-2.5 font-display text-[40px] leading-[.95] uppercase">
        ¿Qué estás
        <br />
        tomando?
      </div>
      <div className="mt-2.5 mb-6 text-[13.5px] leading-relaxed text-ink/65">
        La IA mide el vaso; la graduación la ponés vos eligiendo la bebida.
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {DRINK_TYPES.map((d) => {
          const on = d.id === kind;
          return (
            <button
              key={d.id}
              onClick={() => onPick(d.id)}
              className={`rounded-2xl border p-3.5 text-left transition-colors ${
                on ? 'border-lime bg-lime/10' : 'border-white/10 bg-surface'
              }`}
            >
              <GlassIcon kind={d.id} size={40} />
              <div className="mt-2 font-display text-[22px] leading-none uppercase">{d.label}</div>
              <div className="mt-1.5 text-[11px] leading-snug text-ink/55">{d.hint}</div>
              <div className="mt-2 text-[11px] font-medium text-amber">{fmtAbv(d.abv)}</div>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <Button size="lg" full onClick={onNext}>
        Sacar la foto
      </Button>
      <button
        onClick={onCancel}
        className="mt-2.5 py-2 text-[12px] font-medium tracking-[.1em] text-ink/60"
      >
        CANCELAR
      </button>
    </div>
  );
}

/* ── Paso 2: resultado de la IA ────────────────────────────────── */

function ResultStep({
  result,
  photo,
  kind,
  ml,
  abv,
  setMl,
  setAbv,
  onRetry,
  onSave,
}: {
  result: ScanResult;
  photo: string | null;
  kind: DrinkKind;
  ml: number;
  abv: number;
  setMl: (v: number) => void;
  setAbv: (v: number) => void;
  onRetry: () => void;
  onSave: (add: boolean) => void;
}) {
  const { profile, tragos } = useApp();
  const { puesto, total, bac } = useLeaderboard();
  const [editing, setEditing] = useState(false);

  const grams = gramsOf(ml, abv);
  const delta = bacFromGrams(grams, profile.peso, profile.sexo);
  const next = bac + delta;
  const level = levelOf(next);
  const range = drinkType(kind).abvRange;

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar px-5.5 pt-16 pb-8">
      <div className="text-[11px] leading-none font-medium tracking-[.2em] text-lime">
        IA · CONFIANZA {result.confidence} %
      </div>

      <div className="mt-3.5 flex items-center gap-3.5">
        {photo ? (
          <img src={photo} alt="" className="h-[74px] w-[58px] flex-none rounded-xl object-cover" />
        ) : (
          <GlassIcon kind={kind} size={64} />
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-[32px] leading-[.95] uppercase">
            {result.vesselLabel}
          </div>
          <div className="mt-1.5 text-[12.5px] leading-snug text-ink/65">
            {fmtMl(ml)} · {fmtAbv(abv)} · {result.note}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Metric value={`${Math.round(grams)} g`} label="ALCOHOL PURO" color="#FFB020" />
        <Metric value={`+${fmtBac(delta)}`} label="SUMA A TU ‰" color="#C6F24E" />
        <Metric value={tragos.length + 1} label="TRAGOS HOY" />
      </div>

      {/* Corrección a mano si la IA le pifió */}
      <button
        onClick={() => setEditing((v) => !v)}
        className="mt-3 self-start text-[12px] font-medium tracking-[.08em] text-ink/60 underline decoration-white/20 underline-offset-4"
      >
        {editing ? 'LISTO' : 'NO ERA ESO · CORREGIR MEDIDA'}
      </button>

      {editing && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-[.16em] text-ink/55">TAMAÑO</span>
            <span className="font-display text-[22px] leading-none text-lime tabular">
              {fmtMl(ml)}
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={1500}
            step={5}
            value={ml}
            onChange={(e) => setMl(Number(e.target.value))}
            className="mt-2 w-full accent-[#C6F24E]"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-[.16em] text-ink/55">GRADUACIÓN</span>
            <span className="font-display text-[22px] leading-none text-amber tabular">
              {fmtAbv(abv)}
            </span>
          </div>
          <input
            type="range"
            min={range[0]}
            max={range[1]}
            step={0.5}
            value={abv}
            onChange={(e) => setAbv(Number(e.target.value))}
            className="mt-2 w-full accent-[#FFB020]"
          />
        </div>
      )}

      <div className="mt-5 border-t border-white/12 pt-4.5">
        <Kicker>Tu nivel si lo sumás</Kicker>
        <div className="flex items-end gap-2" style={{ animation: 'var(--animate-rise)' }}>
          <div
            className="font-display text-[92px] leading-[.85] tabular"
            style={{ color: level.color }}
          >
            {fmtBac(next)}
          </div>
          <div className="pb-3 font-display text-[22px] leading-none text-ink/60">‰</div>
        </div>
        <div
          className="mt-1.5 font-display text-[28px] leading-none uppercase"
          style={{ color: level.color }}
        >
          {level.name}
        </div>
        <div className="mt-2 text-[13px] leading-relaxed text-ink/65">{level.sub}</div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-surface p-3.5">
        <div
          className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full font-display text-[17px] leading-none text-night"
          style={{ background: level.color }}
        >
          #{puesto}
        </div>
        <div className="text-[12.5px] leading-snug text-ink/70">
          {puesto === 1
            ? 'Vas primero en la tabla del grupo.'
            : `Estás #${puesto} de ${total} en el grupo.`}
        </div>
      </div>

      <div className="flex-1" />

      <div className="mt-5 flex flex-col gap-2">
        <Button size="lg" full onClick={() => onSave(true)}>
          Guardar vaso y sumar
        </Button>
        <div className="flex gap-2">
          <Button variant="dark" size="sm" full onClick={() => onSave(false)}>
            Solo dejarlo como mi vaso
          </Button>
          <Button variant="dark" size="sm" full onClick={onRetry}>
            Otra foto
          </Button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  value,
  label,
  color,
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex-1 rounded-[14px] border border-white/8 bg-surface p-3.5">
      <div className="font-display text-[24px] leading-none tabular" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] leading-snug font-medium tracking-[.1em] text-ink/60">
        {label}
      </div>
    </div>
  );
}
