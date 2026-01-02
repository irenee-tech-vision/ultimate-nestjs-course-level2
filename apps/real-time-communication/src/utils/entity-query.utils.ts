/**
 * Interface for entities that support soft deletion
 */
export interface SoftDeletableEntity {
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Gets the latest change date for an entity (either deletedAt or updatedAt)
 */
export function getLatestChangeDate<T extends SoftDeletableEntity>(
  entity: T,
): Date {
  return entity.deletedAt && entity.deletedAt > entity.updatedAt
    ? entity.deletedAt
    : entity.updatedAt;
}

/**
 * Filters entities based on soft deletion status and change date
 */
export function filterEntities<T extends SoftDeletableEntity>(
  entities: T[],
  options: { includeDeleted?: boolean; changedSince?: Date },
): T[] {
  const { includeDeleted = false, changedSince } = options;

  return entities.filter((entity) => {
    if (!includeDeleted && entity.deletedAt) {
      return false;
    }

    if (changedSince) {
      return getLatestChangeDate(entity) > changedSince;
    }

    return true;
  });
}

/**
 * Sorts entities by latest change date (descending - newest first)
 */
export function sortEntitiesByLatestChange<T extends SoftDeletableEntity>(
  entities: T[],
): T[] {
  return [...entities].sort((a, b) => {
    return getLatestChangeDate(b).getTime() - getLatestChangeDate(a).getTime();
  });
}
