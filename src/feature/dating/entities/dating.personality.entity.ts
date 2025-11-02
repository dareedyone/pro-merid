import { Entity, PrimaryKey, OneToOne, Property } from '@mikro-orm/core';
import {
  CleanlinessType,
  DressSenseMen,
  DressSenseWomen,
  FinancialAttitudeType,
  GenerousType,
  HonestyType,
  KindnessType,
  PoliticialView,
  UprightnessType,
} from 'src/common/types/enums/user.enum';
import { DatingProfile } from './dating.profile';

@Entity()
export class DatingPersonality {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => DatingProfile, (datingProfile) => datingProfile.personality)
  datingProfile!: DatingProfile;

  @Property({ nullable: true })
  financialAttitude?: FinancialAttitudeType;

  @Property({ nullable: true })
  honesty?: HonestyType;

  @Property({ nullable: true })
  kindess?: KindnessType;

  @Property({ nullable: true })
  generousity?: GenerousType;

  @Property({ nullable: true })
  uprightness?: UprightnessType;

  @Property({ nullable: true })
  politicalView?: PoliticialView;

  @Property({ nullable: true })
  dressSenseWomen?: DressSenseWomen;

  @Property({ nullable: true })
  cleanliness?: CleanlinessType;

  @Property({ nullable: true })
  dressSenseMen?: DressSenseMen;
}
