import { Entity, PrimaryKey, OneToOne, Enum } from '@mikro-orm/core';
import { User } from '../user.entity';
import {
  DressSenseMen,
  DressSenseWomen,
  FinancialAttitudeType,
  GenerousType,
  HonestyType,
  KindnessType,
  PoliticialView,
  PrimaryGuidePhilosophy,
  UprightnessType,
} from 'src/common/types/enums/user.enum';
import { DateProfile } from '../../profile/date.profile';

@Entity()
export class Personality {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => DateProfile, (dateProfile) => dateProfile.personality)
  dateProfile!: User;

  @Enum({
    items: () => FinancialAttitudeType,
    default: FinancialAttitudeType.PREFER_NOT_TO_SAY,
  })
  financialAttitude: FinancialAttitudeType;

  @Enum({ items: () => HonestyType, default: HonestyType.PREFER_NOT_TO_SAY })
  honestLevel: HonestyType;

  @Enum({ items: () => KindnessType, default: KindnessType.PREFER_NOT_TO_SAY })
  kindessLevel: KindnessType;

  @Enum({ items: () => GenerousType, default: GenerousType.PREFER_NOT_TO_SAY })
  generousityLevel: GenerousType;

  @Enum({
    items: () => UprightnessType,
    default: UprightnessType.PREFER_NOT_TO_SAY,
  })
  uprightLevel: UprightnessType;

  @Enum({
    items: () => PoliticialView,
    default: PoliticialView.PREFER_NOT_TO_SAY,
  })
  politicalView: PoliticialView;

  @Enum({
    items: () => DressSenseWomen,
    default: DressSenseMen.PREFER_NOT_TO_SAY,
  })
  dressSenseWomen?: DressSenseWomen;

  @Enum({
    items: () => DressSenseMen,
    default: UprightnessType.PREFER_NOT_TO_SAY,
  })
  dressSenseMen?: DressSenseMen;

  @Enum({
    items: () => PrimaryGuidePhilosophy,
    default: PrimaryGuidePhilosophy.PREFER_NOT_TO_SAY,
  })
  primaryGuidePhilosophy?: PrimaryGuidePhilosophy;
}
