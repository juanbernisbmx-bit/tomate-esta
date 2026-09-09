import { useEffect } from 'react';

/** Aviso corto con "deshacer" para el trago recién sumado. */
export function Toast({
  toast,
  onUndo,
  onClose,
  offset = 'bottom-[104px]',
}: {
  toast: { id: string; text: string; undoId?: string } | null;
  onUndo: (id: string) => void;
  onClose: () => void;
  offset?: string;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      key={toast.id}
      className={`pointer-events-none absolute inset-x-4 ${offset} z-[45] flex justify-center`}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/12 bg-[#1b1815]/95 py-2.5 pr-2.5 pl-4 shadow-[0_10px_30px_rgba(0,0,0,.5)] backdrop-blur"
        style={{ animation: 'var(--animate-pop)' }}
      >
        <span className="text-[13px] leading-tight text-ink/85">{toast.text}</span>
        {toast.undoId && (
          <button
            onClick={() => {
              onUndo(toast.undoId!);
              onClose();
            }}
            className="flex-none rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-ink"
          >
            DESHACER
          </button>
        )}
      </div>
    </div>
  );
}
