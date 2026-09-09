import type { ReactNode } from 'react';

/**
 * En el celular la app va a pantalla completa; en la compu se muestra dentro
 * de un marco tipo iPhone para poder mirarla como se va a ver.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full justify-center bg-night sm:items-center sm:bg-[#0d0c0b] sm:py-8">
      <div className="relative h-[100dvh] w-full overflow-hidden bg-night sm:h-[874px] sm:max-h-[92vh] sm:w-[402px] sm:rounded-[46px] sm:border sm:border-white/10 sm:shadow-[0_40px_120px_rgba(0,0,0,.7)]">
        {/* Brillo ámbar de arriba, del prototipo */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(255,176,32,.16)_0%,rgba(10,9,8,0)_60%)]" />
        <div className="relative z-10 h-full">{children}</div>
        {/* Punto de anclaje de las hojas y overlays: siempre del tamaño del
            teléfono, sin importar cuánto scrollee la pantalla de abajo. */}
        <div id="tmt-overlay" className="pointer-events-none absolute inset-0 z-50" />
      </div>
    </div>
  );
}
