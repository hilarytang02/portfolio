import { PARTNERS, type Partner } from '@/data/partners';

/**
 * Partners in display order (PRD §3). Sorted here rather than in the data file
 * so `order` stays a hand-edited hint — you can drop a new company anywhere in
 * the array and give it the number you want.
 */
export function getPartners(): Partner[] {
  return [...PARTNERS].sort((a, b) => a.order - b.order);
}
