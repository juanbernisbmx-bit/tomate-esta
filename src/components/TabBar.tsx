import type { Screen } from '../lib/types';
import { CameraIcon } from './ui';

/**
 * Barra inferior. El botón central (cámara) escanea el vaso con IA y
 * "+ Trago" suma directo el vaso predeterminado desde cualquier pantalla.
 */
export function TabBar({
  screen,
  onGo,
  onAdd,
  onScan,
}: {
  screen: Screen;
  onGo: (s: Screen) => void;
  onAdd: () => void;
  onScan: () => void;
}) {
  const color = (s: Screen | Screen[]) =>
    (Array.isArray(s) ? s.includes(screen) : screen === s) ? 'text-lime' : 'text-ink/60';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
      <div className="pointer-events-auto flex items-end gap-0.5 bg-gradient-to-t from-night via-night/95 to-transparent px-3.5 pt-8 pb-[max(22px,env(safe-area-inset-bottom))] backdrop-blur-md">
        <Tab label="Nivel" className={color('home')} onClick={() => onGo('home')} />
        <Tab label="+ Trago" className="text-ink/60" onClick={onAdd} />

        <div className="flex w-[70px] flex-none justify-center">
          <button
            aria-label="Escanear vaso con IA"
            onClick={onScan}
            className="-mt-7 grid h-[58px] w-[58px] place-items-center rounded-full border-4 border-night bg-amber text-night shadow-[0_8px_18px_rgba(0,0,0,.45)] active:scale-95"
          >
            <CameraIcon size={24} />
          </button>
        </div>

        <Tab label="Tabla" className={color('rank')} onClick={() => onGo('rank')} />
        <Tab
          label="Perfil"
          className={color(['profile', 'recap'])}
          onClick={() => onGo('profile')}
        />
      </div>
    </div>
  );
}

function Tab({
  label,
  className,
  onClick,
}: {
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 font-display text-[16px] leading-none uppercase transition-colors ${className}`}
    >
      {label}
    </button>
  );
}
