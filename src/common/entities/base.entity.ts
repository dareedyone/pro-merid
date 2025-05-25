import { PrimaryKey, Property, OptionalProps } from '@mikro-orm/core';

export abstract class BaseTimeEntity<Optional = never> {
  [OptionalProps]?: 'createdAt' | 'updatedAt' | Optional;

  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: string;

  @Property()
  createdAt = new Date();

  // @Property({ onUpdate: () => new Date() })
  // updatedAt = new Date();
}
