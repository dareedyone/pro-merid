import { Entity, PrimaryKey, Property, OneToOne, Enum } from '@mikro-orm/core';
import { User } from './user.entity';
import { BodyType } from 'src/types/enums/user.enum';
import { Genotype, RhFactor, YesNo } from 'src/types/enums/other.enum';
import { DateProfile } from '../profile/date.profile';

@Entity()
export class UserBiol {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => DateProfile, (dateProfile) => dateProfile.biol)
  dateProfile!: User;

  @Property({ nullable: true })
  claimedHeightCm?: number;

  @Property({ nullable: true })
  measuredHeightCm?: number;

  @Enum({ items: () => BodyType, default: BodyType.UNKNOWN })
  bodyType: BodyType;

  // todo: ask based on origin and location

  // "Do you carry the sickle cell trait?"
  // If UNKNOWN_BUT_KNOW_GENOTYPE (reveals dropdown)

  @Enum({ items: () => Genotype, nullable: true })
  sickleCellGenotype?: Genotype;

  @Enum({ items: () => YesNo, default: YesNo.UNSURE })
  sickleCellTrait: YesNo;
  //   🔹 Who is most affected?
  // •	Black/African descent (West & Central Africa, Caribbean)
  // •	Mediterranean (Greece, Italy)
  // •	Middle Eastern (Saudi Arabia, Lebanon)
  // •	Indian & South Asian communities
  //   ✅ Conditional Question Trigger
  // If user selects Black, African, Caribbean, Mediterranean, Middle Eastern, or South Asian as their ethnicity,

  @Enum({ items: () => YesNo, default: YesNo.UNSURE })
  thalassemiaTrait: YesNo;
  //   🔹 Who is most affected?
  // •	South Asians (India, Pakistan, Bangladesh)
  // •	Mediterranean (Greek, Italian)
  // •	Middle Eastern (Iran, Lebanon, Saudi Arabia)
  //   ✅ Conditional Question Trigger
  // If user selects South Asian, Mediterranean, or Middle Eastern, then ask:
  // "Do you carry the thalassemia trait?"

  @Enum({ items: () => RhFactor, default: RhFactor.UNSURE })
  rhesusFactor: RhFactor;
  //   🔹 Who is most affected?
  // •	Women (people) of all ethnicities (but mostly relevant for those planning to have children)
  //   ✅ Conditional Question Trigger
  // Need to ask for all users planning to have children for compatibility logic
  // "Do you know your Rh factor (blood type +/–)?"
  @Enum({ items: () => YesNo, default: YesNo.UNSURE })
  taySachsTrait: YesNo; // Triggered for Ashkenazi Jewish/French Canadian
  // "Do you carry the Tay-Sachs trait?"

  @Enum({ items: () => YesNo, default: YesNo.UNSURE })
  cysticFibrosisTrait: YesNo; // Triggered for European descent
  // "Do you carry the CFTR gene?"

  @Enum({ items: () => YesNo, default: YesNo.UNSURE })
  g6pdDeficiency: YesNo; //  African/Mediterranean/Middle Eastern
}
