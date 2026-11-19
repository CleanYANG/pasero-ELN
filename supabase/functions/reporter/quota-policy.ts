// Server configuration only; the user id must come from auth.getUser().
export function unlimitedActionsFor(userId: string, configuredUserIds: string): string[] {
  const users = configuredUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return userId && users.includes(userId) ? ['chat', 'image'] : [];
}

// Points per action — the same table as pasero.app/pricing and shared/access-policy.json.
// A long protocol (source above LONG_SOURCE_TOKENS) costs PROTOCOL_LONG instead of protocol.
export const POINT_COST: Record<string, number> = {
  chat: 1, image: 2, protocol_ask: 2, layout: 5, protocol_revise: 5,
  protocol: 8, revise: 10, paper: 20, ppt: 20, poster: 20,
};
export const PROTOCOL_LONG = 12;

export function costOf(action: string, long = false): number {
  if (action === 'protocol' && long) return PROTOCOL_LONG;
  return POINT_COST[action] ?? 0;
}

// counts: successful calls per action since the trial started; longProtocols: how many of the protocol calls were long.
export function pointsUsed(counts: Record<string, number>, longProtocols = 0): number {
  let total = 0;
  for (const [a, n] of Object.entries(counts)) total += (POINT_COST[a] ?? 0) * (n || 0);
  return total + (PROTOCOL_LONG - POINT_COST.protocol) * Math.max(0, longProtocols);
}

export type Quota = {
  used: Record<string, number>; limit: Record<string, number>; unlimited: string[];
  points?: { grant: number; used: number; remaining: number; cost: Record<string, number> };
};

// Per-action limits kept for older apps: how many more of each action the remaining points allow, on top of what was used.
export function perActionLimits(used: Record<string, number>, remaining: number): Record<string, number> {
  const limit: Record<string, number> = {};
  for (const [a, c] of Object.entries(POINT_COST)) limit[a] = (used[a] ?? 0) + Math.floor(Math.max(0, remaining) / c);
  return limit;
}

export function quotaExceeded(action: string, quota: Quota, long = false): boolean {
  if (quota.unlimited.includes(action)) return false;
  if (quota.points) return quota.points.remaining < costOf(action, long);
  return quota.used[action] >= quota.limit[action];
}
