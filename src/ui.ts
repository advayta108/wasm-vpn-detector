/** Tailwind class sets for VPN likelihood score buckets. */
export function scoreTone(score: number): string {
  if (score >= 70) return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
  if (score >= 35) return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
  return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
}
