import { fmtHour, uvAdvice, type Advice } from '@/engine/advice';
import type { Settings } from '@/engine/types';

/** Stories viewed this session (per day), so bubbles can show as seen. */
export const seenStories = new Set<string>();

export type StoryKind = 'outfit' | 'hair' | 'rain' | 'sun';
export type Story = { id: StoryKind; label: string; title: string; body: string };

export function buildStories(a: Advice, s: Settings): Story[] {
  const list: Story[] = [];
  const cyc = s.cover.commute && s.move === 'cycle';
  if (s.cover.outfit) {
    const body =
      (a.warmUp
        ? `It feels ${a.mine}° to you when you're out, but ${a.lunch}° by lunch, so wear layers you can peel off.`
        : `It feels around ${a.mine}° to you while you're out.`) +
      (a.brolly ? ` ${cyc ? 'Waterproofs are' : "The brolly's"} for ${fmtHour(a.rainStart ?? s.back)}.` : '') +
      (s.cover.hair && a.frizz >= 4 && a.curly ? " And the claw clip's for when your curls get ideas." : '');
    list.push({ id: 'outfit', label: 'Outfit', title: a.wear, body });
  }
  if (s.cover.hair && s.hair !== 'short') list.push({ id: 'hair', label: 'Hair', title: a.hair.label, body: a.hair.tip });
  list.push({
    id: 'rain',
    label: a.brolly ? `Rain ${fmtHour(a.rainStart!)}` : 'Dry day',
    title: a.brolly ? `${cyc ? 'Waterproofs' : 'Brolly'} for ${fmtHour(a.rainStart!)}` : 'No brolly needed',
    body: a.brolly
      ? `Rain from about ${fmtHour(a.rainStart!)} to ${fmtHour(a.rainEnd! + 1)}, ${Math.max(a.rOut, a.rHome)}% chance while you're out.`
      : 'Dry from morning to night.',
  });
  if (s.cover.skin) {
    const u = uvAdvice(a.uv);
    list.push({ id: 'sun', label: 'SPF', title: u.title, body: u.body });
  }
  return list;
}
