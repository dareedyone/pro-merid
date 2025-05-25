import { Entity, ManyToOne, Unique } from '@mikro-orm/core';

import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { User } from 'src/modules/user/entities/user/user.entity';
import { Suggestion } from './suggestion.entity';

@Entity()
@Unique({ properties: ['suggestion', 'user'] })
export class SuggestionVote extends BaseSingleEntity {
  @ManyToOne(() => Suggestion)
  suggestion!: Suggestion;

  @ManyToOne(() => User)
  user!: User;
}
