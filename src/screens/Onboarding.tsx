import { useState } from 'react';
import { Button, BackIcon } from '../components/ui';
import type { Profile, Sexo } from '../lib/types';
import { R_FACTOR } from '../lib/alcohol';

const STEPS = [
  {
    kicker: 'Calibración · paso 1',
    title: 'Tu peso',
    hint: 'Cuánto pesás define cómo te pega cada trago. Tocá una barra o ajustá de a un kilo.',
    foot: 'Podés cambiarlo después desde tu perfil.',
    cta: 'Seguir',
  },
  {
    kicker: 'Calibración · paso 2',
    title: 'Sexo',
    hint: 'Cambia el agua corporal y con eso la curva de alcohol en sangre.',
    foot: 'Solo se usa para el cálculo. No se muestra en el grupo.',
    cta: 'Seguir',
  },
  {
    kicker: 'Calibración · paso 3',
    title: 'Edad',
    hint: 'Último dato de la calibración y arrancamos.',
    foot: 'Tomate es para mayores de 18.',
    cta: 'Seguir',
  },
  {
    kicker: 'Último paso',
    title: 'Foto al trago',
    hint: 'Le sacás una foto a lo que estás tomando y la IA estima el tamaño del vaso.',
    foot: 'Podés negarlo y registrar tragos con los vasos predeterminados.',
    cta: 'Permitir cámara',
  },
];

const SEXOS: Array<{ id: Sexo; label: string; sub: string }> = [
  { id: 'H', label: 'Hombre', sub: `Factor de distribución ${R_FACTOR.H.toString().replace('.', ',')}` },
  { id: 'M', label: 'Mujer', sub: `Factor de distribución ${R_FACTOR.M.toString().replace('.', ',')}` },
  { id: 'X', label: 'Prefiero no decir', sub: 'Usamos un promedio de 0,615' },
];

export function Onboarding({
  profile,
  onChange,
  onDone,
  onExit,
}: {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
  onDone: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState(1);
  const copy = STEPS[step - 1];

  const next = async () => {
    if (step < 4) return setStep(step + 1);
    // Último paso: pedimos la cámara ahora para que después el escaneo sea directo.
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ video: true });
      stream?.getTracks().forEach((t) => t.stop());
    } catch {
      /* si la niega, igual puede usar los vasos predeterminados */
    }
    onDone();
  };

  return (
    <div className="relative h-full px-6 pt-16">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : onExit())}
          className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full border border-white/14 bg-surface text-ink"
        >
          <BackIcon />
        </button>
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${step >= n ? 'bg-lime' : 'bg-white/14'}`}
            />
          ))}
        </div>
        <div className="text-[11px] leading-none font-medium tracking-[.14em] text-ink/60">
          {step}/4
        </div>
      </div>

      <div className="mb-2.5 text-[12px] leading-none tracking-[.2em] text-amber uppercase">
        {copy.kicker}
      </div>
      <div className="mb-2.5 font-display text-[44px] leading-[.95] uppercase">{copy.title}</div>
      <div className="mb-7 max-w-[300px] text-[13.5px] leading-relaxed text-ink/65">
        {copy.hint}
      </div>

      {step === 1 && (
        <TickPicker
          value={profile.peso}
          unit="KG"
          min={40}
          max={200}
          onChange={(peso) => onChange({ peso })}
        />
      )}

      {step === 2 && (
        <div className="flex flex-col gap-2.5">
          {SEXOS.map((s) => {
            const on = profile.sexo === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange({ sexo: s.id })}
                className={`rounded-[18px] border px-5 py-4 text-left transition-colors ${
                  on ? 'border-lime bg-lime/8' : 'border-white/12 bg-surface'
                }`}
              >
                <div className="font-display text-[26px] leading-none uppercase">{s.label}</div>
                <div className="mt-1.5 text-[12px] leading-snug text-ink/60">{s.sub}</div>
              </button>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <TickPicker
          value={profile.edad}
          unit="AÑOS"
          min={18}
          max={99}
          onChange={(edad) => onChange({ edad })}
        />
      )}

      {step === 4 && (
        <div>
          <div className="flex flex-col gap-4 rounded-[20px] border border-white/10 bg-surface p-5">
            <Paso n="1" color="#FFB020" ink="#0A0908">
              Elegís qué estás tomando (cerveza, vino, trago, shot) y le sacás una foto al vaso.
            </Paso>
            <Paso n="2" color="#E8402A" ink="#FAF7F2">
              La IA estima el tamaño del vaso y, con la graduación de esa bebida, el alcohol puro.
            </Paso>
            <Paso n="3" color="#C6F24E" ink="#0A0908">
              Ese vaso queda como tu predeterminado: después sumás tragos con un solo toque.
            </Paso>
          </div>
          <div className="mt-3.5 rounded-2xl border border-dashed border-white/16 px-4 py-3.5 text-[12px] leading-relaxed text-ink/60">
            Es una estimación para jugar entre amigos, no un test legal ni médico.
          </div>
        </div>
      )}

      <div className="absolute inset-x-6 bottom-11">
        <div className="mb-3 text-center text-[11.5px] leading-snug text-ink/65">{copy.foot}</div>
        <Button size="lg" full variant={step === 4 ? 'lime' : 'ink'} onClick={next}>
          {copy.cta}
        </Button>
      </div>
    </div>
  );
}

function Paso({
  n,
  color,
  ink,
  children,
}: {
  n: string;
  color: string;
  ink: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[10px] font-display text-[17px] leading-none"
        style={{ background: color, color: ink }}
      >
        {n}
      </div>
      <div className="text-[13px] leading-relaxed text-ink/70">{children}</div>
    </div>
  );
}

/** Selector de barras estilo "dial": la del centro es el valor actual. */
function TickPicker({
  value,
  unit,
  min,
  max,
  onChange,
}: {
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const ticks = Array.from({ length: 13 }, (_, i) => i - 6).map((i) => {
    const v = value + i;
    const active = i === 0;
    return {
      v,
      active,
      valid: v >= min && v <= max,
      h: active ? 58 : 22 + (6 - Math.abs(i)) * 4,
      opacity: 0.1 + (6 - Math.abs(i)) * 0.035,
    };
  });

  return (
    <div>
      <div className="flex items-baseline justify-center gap-2">
        <div className="font-display text-[96px] leading-[.85] text-lime tabular">{value}</div>
        <div className="font-display text-[22px] leading-none text-ink/60">{unit}</div>
      </div>

      <div className="mt-4.5 flex h-[62px] items-end justify-center gap-1.5">
        {ticks.map((t, i) => (
          <button
            key={i}
            disabled={!t.valid}
            onClick={() => onChange(t.v)}
            className="flex-1 rounded-[3px] transition-all"
            style={{
              height: t.h,
              background: t.active ? '#C6F24E' : `rgba(250,247,242,${t.valid ? t.opacity : 0.04})`,
            }}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3.5">
        <RoundBtn onClick={() => onChange(Math.max(min, value - 1))}>−</RoundBtn>
        <div className="w-[120px] text-center text-[11px] leading-none font-medium tracking-[.16em] text-ink/60">
          AJUSTE FINO
        </div>
        <RoundBtn onClick={() => onChange(Math.min(max, value + 1))}>+</RoundBtn>
      </div>
    </div>
  );
}

function RoundBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="grid h-[52px] w-[52px] place-items-center rounded-full border border-white/16 bg-surface font-display text-[24px] leading-none active:bg-surface-2"
    >
      {children}
    </button>
  );
}
