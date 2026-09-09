import { Button, Kicker } from '../components/ui';
import { bacFromGrams, hoursToSober } from '../lib/alcohol';
import { fmtBac, fmtClock, fmtHours, fmtMl } from '../lib/format';
import { useActions, useApp } from '../state/store';
import { useLeaderboard } from '../state/selectors';

/** Medalla de la noche según cómo se portó. */
function medalla(tragos: number, pico: number, distintos: number) {
  if (tragos === 0) return { name: 'Fantasma', sub: 'Cero tragos cargados. ¿Estuviste?' };
  if (pico >= 1) return { name: 'Locomotora', sub: 'Pico arriba de 1 ‰ y sin frenar.' };
  if (distintos >= 4) return { name: 'Sommelier', sub: 'Probaste de todo, sin repetir vaso.' };
  if (tragos >= 6) return { name: 'Maratonista', sub: 'Ritmo parejo toda la noche.' };
  if (pico < 0.3) return { name: 'El del agua', sub: 'Fuiste el que maneja. Gracias.' };
  return { name: 'Piola', sub: 'Justo en el punto: la mejor versión tuya.' };
}

export function Recap() {
  const { profile, tragos, group } = useApp();
  const { closeNight, go, showToast } = useActions();
  const { bac, puesto, total } = useLeaderboard();

  const gramos = tragos.reduce((a, t) => a + t.grams, 0);
  const pico = bacFromGrams(gramos, profile.peso, profile.sexo);
  const distintos = new Set(tragos.map((t) => t.label)).size;
  const ml = tragos.reduce((a, t) => a + t.ml, 0);
  const m = medalla(tragos.length, pico, distintos);

  const cerrar = async () => {
    const texto = `Tomate · ${group?.name ?? 'la noche'}: ${tragos.length} tragos, pico ${fmtBac(
      pico,
    )} ‰, puesto #${puesto} de ${total}.`;
    try {
      if (navigator.share) await navigator.share({ title: 'Tomate', text: texto });
    } catch {
      /* si cancela el share, igual cerramos la noche */
    }
    closeNight({ peakBac: pico, tragos: tragos.length, grams: gramos, puesto });
    showToast('Noche cerrada. Quedó en tu historial.');
    go('home');
  };

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar px-6 pt-16 pb-[130px]">
      <div className="mb-2 text-[12px] leading-none font-medium tracking-[.2em] text-amber uppercase">
        Resumen · {new Date().toLocaleDateString('es-AR', { weekday: 'short' })} ·{' '}
        {fmtClock(Date.now())}
      </div>
      <div className="font-display text-[46px] leading-[.95] uppercase">
        {tragos.length === 0 ? 'Noche limpia' : 'Sobreviviste'}
      </div>

      <div className="mt-5 rounded-[20px] bg-gradient-to-br from-red to-amber p-5 text-night">
        <div className="text-[11px] leading-none font-medium tracking-[.16em] opacity-70">
          MEDALLA DE LA NOCHE
        </div>
        <div className="mt-2 font-display text-[34px] leading-none uppercase">{m.name}</div>
        <div className="mt-1.5 text-[13px] leading-snug opacity-85">{m.sub}</div>
      </div>

      <div className="mt-3 flex gap-2.5">
        <Caja value={fmtBac(pico)} label="PICO ‰" color="#FFB020" />
        <Caja value={tragos.length} label="TRAGOS" />
        <Caja value={`#${puesto}`} label="PUESTO" color="#C6F24E" />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 p-4">
        <Kicker>El detalle</Kicker>
        <div className="mt-2.5 text-[13.5px] leading-relaxed text-ink/70">
          Tomaste <span className="text-ink">{fmtMl(ml)}</span> en total ·{' '}
          <span className="text-ink">{Math.round(gramos)} g</span> de alcohol puro ·{' '}
          {distintos} {distintos === 1 ? 'vaso distinto' : 'vasos distintos'}.
        </div>
        <div className="mt-3 text-[13.5px] leading-relaxed text-ink/60">
          Estás a <span className="text-ink">{fmtHours(hoursToSober(bac))}</span> de cero. Dejá el
          auto donde está y compartí el viaje.
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="ink" size="lg" full onClick={cerrar}>
          Compartir y cerrar
        </Button>
        <Button variant="ghost" size="sm" full onClick={() => go('home')}>
          Seguir la noche
        </Button>
      </div>
    </div>
  );
}

function Caja({
  value,
  label,
  color,
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-white/8 bg-surface p-4">
      <div className="font-display text-[30px] leading-none tabular" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] leading-snug font-medium tracking-[.12em] text-ink/60">
        {label}
      </div>
    </div>
  );
}
