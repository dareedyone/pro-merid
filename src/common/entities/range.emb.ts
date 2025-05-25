import { Embeddable, Property } from '@mikro-orm/core';

@Embeddable()
export class RangeEmb {
  @Property()
  min: number;

  @Property()
  max: number;

  constructor(min: number = -Infinity, max: number = Infinity) {
    this.min = min;
    this.max = max;
  }
}
