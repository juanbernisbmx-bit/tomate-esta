import { Button } from '../components/ui';

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex h-full flex-col justify-end gap-5 px-7 pb-14">
      {/* Vaso-logo */}
      <div className="absolute top-[16%] left-7 h-[120px] w-24 rounded-t-lg rounded-b-2xl bg-gradient-to-b from-amber via-[#E8940F] to-amber-dark shadow-[0_24px_60px_rgba(255,176,32,.28)]">
        <div className="m-1.5 h-[34px] rounded bg-white/80" />
        <div className="mx-1.5 h-[5px] rounded-full bg-black/15" />
      </div>

      <div className="font-display text-[74px] leading-[.86] tracking-tight uppercase">
        Tomate<span className="text-red">.</span>
      </div>
      <div className="max-w-[280px] text-[15px] leading-relaxed font-medium text-ink/60">
        Foto al trago, la IA calcula cuánto alcohol es y el grupo ve quién va ganando la carrera.
      </div>

      <Button size="lg" full className="mt-2" onClick={onStart}>
        Arrancar la noche
      </Button>

      <div className="text-center text-[11.5px] leading-snug text-ink/60">
        Estimación orientativa. No es un test legal.
      </div>
    </div>
  );
}
