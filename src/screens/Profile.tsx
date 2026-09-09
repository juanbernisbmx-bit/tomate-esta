import { Button, Kicker } from '../components/ui';
import { fmtBac, fmtNum } from '../lib/format';
import type { Sexo } from '../lib/types';
import { useActions, useApp } from '../state/store';
import { useLeaderboard } from '../state/selectors';

const SEXOS: Array<{ id: Sexo; label: string }> = [
  { id: 'H', label: 'Hombre' },
  { id: 'M', label: 'Mujer' },
  { id: 'X', label: 'N/D' },
];

export function Profile() {
  const { profile, history, tragos } = useApp();
  const { setProfile, go, reset } = useActions();
  const { bac, puesto } = useLeaderboard();

  const noches = history.length;
  const picos = [...history.map((h) => h.peakBac), bac];
  const pico = Math.max(...picos, 0);
  const vecesPrimero = history.filter((h) => h.puesto === 1).length + (puesto === 1 ? 1 : 0);
  const promedio = picos.reduce((a, b) => a + b, 0) / Math.max(1, picos.length);
  const tragosPorNoche =
    (history.reduce((a, h) => a + h.tragos, 0) + tragos.length) / Math.max(1, noches + 1);

  // Últimas 7 noches: las cerradas + la de hoy al final, rellenando con vacías.
  const cerradas = history.slice(0, 6).map((h) => h.peakBac).reverse();
  const serie: Array<number | null> = [...cerradas, bac];
  const barras: Array<number | null> = [
    ...Array<null>(Math.max(0, 7 - serie.length)).fill(null),
    ...serie,
  ];
  const maxBarra = Math.max(...cerradas, bac, 0.4);

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar px-5.5 pt-16 pb-[130px]">
      <div className="mb-5 flex items-center gap-3.5">
        <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-lime font-display text-[26px] leading-none text-night">
          YO
        </div>
        <div>
          <div className="font-display text-[30px] leading-none uppercase">
            {profile.nombre || 'Vos'}
          </div>
          <div className="mt-1 text-[12px] leading-snug text-ink/60">
            {profile.peso} kg · {profile.edad} años · {noches + 1}{' '}
            {noches === 0 ? 'noche' : 'noches'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Big value={fmtBac(pico)} label="PICO HISTÓRICO ‰" color="#FFB020" />
        <Big value={vecesPrimero} label="VECES #1" color="#C6F24E" />
        <Big value={fmtBac(promedio)} label="PROMEDIO ‰" />
        <Big value={fmtNum(tragosPorNoche, 1)} label="TRAGOS/NOCHE" />
      </div>

      <div className="mt-5">
        <Kicker>Últimas noches</Kicker>
        <div className="mt-3 flex h-[110px] items-end gap-1.5">
          {barras.map((b, i) => {
            const hoy = i === barras.length - 1;
            const vacia = b === null;
            return (
              <div
                key={i}
                className="flex-1 rounded-t-md rounded-b-[3px]"
                style={{
                  height: vacia ? '8%' : `${Math.max(8, (b / maxBarra) * 100)}%`,
                  background: vacia
                    ? '#221f1b'
                    : hoy
                      ? '#C6F24E'
                      : b >= maxBarra
                        ? '#FFB020'
                        : '#3a342b',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Ajustes rápidos: cambian el cálculo al instante */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-surface p-4">
        <Kicker>Calibración</Kicker>

        <Fila label="Peso">
          <Stepper
            value={`${profile.peso} kg`}
            onLess={() => setProfile({ peso: Math.max(40, profile.peso - 1) })}
            onMore={() => setProfile({ peso: Math.min(200, profile.peso + 1) })}
          />
        </Fila>

        <Fila label="Edad">
          <Stepper
            value={`${profile.edad}`}
            onLess={() => setProfile({ edad: Math.max(18, profile.edad - 1) })}
            onMore={() => setProfile({ edad: Math.min(99, profile.edad + 1) })}
          />
        </Fila>

        <Fila label="Sexo">
          <div className="flex gap-1.5">
            {SEXOS.map((s) => (
              <button
                key={s.id}
                onClick={() => setProfile({ sexo: s.id })}
                className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium ${
                  profile.sexo === s.id
                    ? 'bg-ink text-night'
                    : 'border border-white/14 text-ink/65'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Fila>
      </div>

      <Button variant="dark" size="md" full className="mt-4" onClick={() => go('recap')}>
        Cerrar la noche
      </Button>

      <button
        onClick={() => {
          if (confirm('¿Borrar todo y arrancar de cero?')) reset();
        }}
        className="mt-4 w-full py-2 text-[12px] font-medium tracking-[.08em] text-ink/40"
      >
        BORRAR MIS DATOS
      </button>
    </div>
  );
}

function Big({
  value,
  label,
  color,
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-4">
      <div className="font-display text-[34px] leading-none tabular" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[10.5px] leading-snug font-medium tracking-[.12em] text-ink/60">
        {label}
      </div>
    </div>
  );
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3.5 flex items-center justify-between">
      <span className="text-[13.5px] text-ink/75">{label}</span>
      {children}
    </div>
  );
}

function Stepper({
  value,
  onLess,
  onMore,
}: {
  value: string;
  onLess: () => void;
  onMore: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onLess}
        className="grid h-8 w-8 place-items-center rounded-full border border-white/14 font-display text-[18px] leading-none"
      >
        −
      </button>
      <span className="w-[62px] text-center font-display text-[18px] leading-none tabular">
        {value}
      </span>
      <button
        onClick={onMore}
        className="grid h-8 w-8 place-items-center rounded-full border border-white/14 font-display text-[18px] leading-none"
      >
        +
      </button>
    </div>
  );
}
