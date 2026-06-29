export interface Signal {
  name: string;
  detail: string;
  weight: number; // contribution to the 0-100 "VPN likely" score
}

export interface Verdict {
  score: number; // 0-100
  label: string;
  signals: Signal[];
}

export function combineSignals(signals: Signal[]): Verdict {
  const score = Math.max(0, Math.min(100, signals.reduce((sum, s) => sum + s.weight, 0)));
  let label: string;
  if (score >= 70) label = 'Похоже, используется VPN / proxy';
  else if (score >= 35) label = 'Есть отдельные признаки, но не точно';
  else label = 'Явных признаков VPN не обнаружено';
  return { score, label, signals };
}
