export const ACTIVE_DEBT_WHERE = { deletedAt: null } as const;

export const DELETED_DEBT_WHERE = { deletedAt: { not: null } } as const;
