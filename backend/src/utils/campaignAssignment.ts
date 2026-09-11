/**
 * Deterministically maps a campaign name to one counselor from the given
 * list, so every lead belonging to the same marketing campaign always lands
 * with the same counselor - instead of round-robin scattering leads from
 * one campaign across multiple counselors.
 *
 * No persisted mapping table is needed: the same campaign name always
 * hashes to the same index, as long as the counselor list's order is
 * derived consistently (e.g. active users sorted by id). If the counselor
 * roster changes, campaigns may reshuffle across counselors - a stable
 * team makes this a non-issue in practice.
 */
export function getCounselorForCampaign(
  campaignName: string | null | undefined,
  counselors: string[]
): string | null {
  const normalized = campaignName ? String(campaignName).trim().toLowerCase() : '';
  if (!normalized || counselors.length === 0) return null;

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return counselors[hash % counselors.length];
}
