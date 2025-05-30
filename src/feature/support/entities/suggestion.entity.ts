import {
  Entity,
  ManyToOne,
  OneToMany,
  Collection,
  Property,
} from '@mikro-orm/core';

import { BaseSingleEntity } from 'src/common/entities/base.single.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { SuggestionVote } from './suggestion-vote.entity';

@Entity()
export class Suggestion extends BaseSingleEntity {
  @Property()
  title?: string;

  @Property({ type: 'text' })
  description?: string;

  @Property({ nullable: true })
  page?: string; // e.g. "ethnicity_form" or "profile_editor"

  @Property({ nullable: true })
  field?: string; // e.g. "ethnicity", "religion"

  @Property({ nullable: true })
  suggestedValue?: string; // e.g. "Martian"

  @Property({ type: 'boolean' })
  isGeneral: boolean = false; // true = platform-level, false = specific field

  @ManyToOne(() => User)
  submittedBy!: User;

  @Property({ type: 'boolean' })
  approved: boolean = false; // or use a status enum if needed

  @OneToMany(() => SuggestionVote, (vote) => vote.suggestion)
  votes = new Collection<SuggestionVote>(this);
}
