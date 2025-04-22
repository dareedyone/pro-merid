import { Index, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseSingleEntity {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @Property()
  @Index()
  name: string;
}
