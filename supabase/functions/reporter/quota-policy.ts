// Server configuration only; the user id must come from auth.getUser().
export function unlimitedActionsFor(userId: string, configuredUserIds: string): string[] {
  const users = configuredUserIds.split(',').map((id) => id.trim()).filter(Boolean);
  return userId && users.includes(userId) ? ['chat', 'image'] : [];
}

export function quotaExceeded(action: string, quota: {
  used: Record<string, number>; limit: Record<string, number>; unlimited: string[];
}): boolean {
  return !quota.unlimited.includes(action) && quota.used[action] >= quota.limit[action];
}
