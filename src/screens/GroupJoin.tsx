import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui';
import { fetchGroup } from '../api/client';
import { initials } from '../lib/format';
import type { Group } from '../lib/types';

const CODE_LEN = 4;

export function GroupJoin({ onJoin }: { onJoin: (g: Group) => void }) {
  const [code, setCode] = useState('TMT4');
  const [found, setFound] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (value: string) => {
    if (value.length < CODE_LEN) return setFound(null);
    setLoading(true);
    try {
      setFound(await fetchGroup(value));
    } finally {
      setLoading(false);
    }
  };

  // Buscamos el código que viene precargado apenas entra.
  useEffect(() => {
    void search(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCode = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
    setCode(clean);
    void search(clean);
  };

  const createNew = async () => {
    const g = await fetchGroup(code || 'NEW1');
    onJoin({ ...g, name: 'Tu grupo', members: [] });
  };

  return (
    <div className="relative flex h-full flex-col px-6 pt-[70px] pb-10">
      <div className="mb-1.5 font-display text-[40px] leading-none uppercase">Tu barra</div>
      <div className="mb-7 text-[13.5px] leading-relaxed text-ink/65">
        Unite con el código que pasa el grupo.
      </div>

      {/* Casilleros del código: un input invisible arriba capta el teclado */}
      <div className="relative mb-3.5">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => onCode(e.target.value)}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="absolute inset-0 z-10 w-full opacity-0"
          aria-label="Código del grupo"
        />
        <div className="flex gap-2.5">
          {Array.from({ length: CODE_LEN }, (_, i) => {
            const char = code[i] ?? '';
            const active = i === code.length;
            return (
              <div
                key={i}
                className={`flex h-[66px] flex-1 items-center justify-center rounded-[14px] border bg-surface font-display text-[30px] leading-none ${
                  active ? 'border-2 border-lime text-lime' : 'border-white/14 text-amber'
                }`}
              >
                {char}
              </div>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="rounded-[18px] border border-white/10 bg-surface p-4.5 text-[13px] text-ink/60">
          Buscando el grupo…
        </div>
      )}

      {found && !loading && (
        <div
          className="mb-3 rounded-[18px] border border-white/10 bg-surface p-4.5"
          style={{ animation: 'var(--animate-pop)' }}
        >
          <div className="mb-3 text-[11px] leading-none font-medium tracking-[.18em] text-ink/60">
            GRUPO ENCONTRADO
          </div>
          <div className="flex items-center gap-3">
            <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-red font-display text-[20px] leading-none">
              {initials(found.name)}
            </div>
            <div>
              <div className="font-display text-[24px] leading-none uppercase">{found.name}</div>
              <div className="mt-1 text-[12px] leading-snug text-ink/60">
                {found.members.length + 1} en línea · ya arrancaron
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1" />

      <Button size="lg" full disabled={!found} onClick={() => found && onJoin(found)}>
        Unirme
      </Button>
      <button
        onClick={createNew}
        className="mt-2.5 py-2 text-[13px] font-medium text-ink/60 active:text-ink"
      >
        Crear un grupo nuevo
      </button>
    </div>
  );
}
