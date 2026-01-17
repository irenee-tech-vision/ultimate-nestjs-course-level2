import { Override } from '../entities/override.entity';

export const OVERRIDE_EVENTS = {
  CREATED: 'override.created',
  UPDATED: 'override.updated',
  DELETED: 'override.deleted',
  ALL: 'override.*',
} as const;

export class OverrideCreatedEvent {
  static readonly eventName = OVERRIDE_EVENTS.CREATED;
  constructor(public readonly override: Override) {}
}

export class OverrideUpdatedEvent {
  static readonly eventName = OVERRIDE_EVENTS.UPDATED;
  constructor(public readonly override: Override) {}
}

export class OverrideDeletedEvent {
  static readonly eventName = OVERRIDE_EVENTS.DELETED;
  constructor(public readonly override: Override) {}
}
