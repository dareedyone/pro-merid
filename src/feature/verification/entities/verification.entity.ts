import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';

import {
  VerificationStatus,
  VerificationType,
} from 'src/common/types/enums/user.enum';
import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { User } from 'src/feature/user/entities/user/user.entity';

@Entity()
export class Verification extends BaseTimeEntity {
  @ManyToOne(() => User)
  user!: User;

  @Property({
    default: VerificationType.OTHER,
  })
  type: VerificationType;

  @Property({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @Property({
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt? = new Date();
}
