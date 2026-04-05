export const DONUT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#a855f7', '#3b82f6', '#fb923c', '#4ade80', '#f472b6', '#38bdf8',
];

export const D_CX = 120;
export const D_CY = 120;
export const D_R  = 96;
export const D_r  = 56;
export const D_GAP = 0.03;

export function dPolar(angle: number, r: number) {
  return { x: D_CX + r * Math.cos(angle), y: D_CY + r * Math.sin(angle) };
}

export function dSectorRaw(a1: number, a2: number, ro = D_R, ri = D_r): string {
  if (a2 - a1 < 0.001) return '';
  const large = a2 - a1 > Math.PI ? 1 : 0;
  const p1 = dPolar(a1, ro), p2 = dPolar(a2, ro);
  const p3 = dPolar(a2, ri), p4 = dPolar(a1, ri);
  return `M${p1.x},${p1.y} A${ro},${ro},0,${large},1,${p2.x},${p2.y} L${p3.x},${p3.y} A${ri},${ri},0,${large},0,${p4.x},${p4.y}Z`;
}

export function dSector(sa: number, ea: number, ro = D_R, ri = D_r): string {
  const span = ea - sa;
  if (span < 0.001) return '';
  const hg = Math.min(D_GAP / 2, span * 0.08);
  return dSectorRaw(sa + hg, ea - hg, ro, ri);
}
