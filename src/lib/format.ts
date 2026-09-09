/** Formateo con coma decimal (es-AR) y textos cortos. */

export function fmtBac(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

export function fmtNum(n: number, decimals = 1): string {
  return n.toFixed(decimals).replace('.', ',');
}

export function fmtMl(ml: number): string {
  return ml >= 1000 ? `${fmtNum(ml / 1000, ml % 1000 === 0 ? 0 : 1)} L` : `${Math.round(ml)} ml`;
}

export function fmtAbv(abv: number): string {
  return `${fmtNum(abv, abv % 1 === 0 ? 0 : 1)} % vol`;
}

export function fmtGrams(g: number): string {
  return `${Math.round(g)} g`;
}

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function fmtAgo(ts: number, now: number = Date.now()): string {
  const min = Math.floor((now - ts) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `hace ${h} h` : `hace ${h} h ${rest}`;
}

export function fmtHours(h: number): string {
  if (h <= 0) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${fmtNum(h, 1)} h`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const raw = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return raw.toUpperCase();
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}
