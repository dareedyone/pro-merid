import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { BodyType } from 'src/common/types/enums/user.enum';
import { RhFactor } from 'src/common/types/enums/other.enum';
import { DatingProfile } from './dating.profile';

@Entity()
export class DatingBiol {
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OneToOne(() => DatingProfile, (dateProfile) => dateProfile.biol)
  dateProfile!: DatingProfile;

  @Property({ nullable: true })
  claimedHeightCm?: number;

  @Property({ nullable: true })
  measuredHeightCm?: number;

  @Property({ nullable: true, default: BodyType.UNKNOWN })
  bodyType?: BodyType;

  // todo: ask based on origin and location

  // "Do you carry the sickle cell trait?"
  // If UNKNOWN_BUT_KNOW_GENOTYPE (reveals dropdown)

  // note: we are removing this bc we want to make client calculate this and only send hasSickleCellTrait
  // @Property({ nullable: true })
  // sickleCellGenotype?: Genotype;

  @Property({ nullable: true })
  sickleCellTrait?: boolean;

  @Property({ nullable: true })
  sickleCellDisease?: boolean;

  //   🔹 Who is most affected?
  // •	Black/African descent (West & Central Africa, Caribbean)
  // •	Mediterranean (Greece, Italy)
  // •	Middle Eastern (Saudi Arabia, Lebanon)
  // •	Indian & South Asian communities
  //   ✅ Conditional Question Trigger
  // If user selects Black, African, Caribbean, Mediterranean, Middle Eastern, or South Asian as their ethnicity,

  @Property({ nullable: true })
  thalassemiaTrait?: boolean;

  //   🔹 Who is most affected?
  // •	South Asians (India, Pakistan, Bangladesh)
  // •	Mediterranean (Greek, Italian)
  // •	Middle Eastern (Iran, Lebanon, Saudi Arabia)
  //   ✅ Conditional Question Trigger
  // If user selects South Asian, Mediterranean, or Middle Eastern, then ask:
  // "Do you carry the thalassemia trait?"

  @Property({ nullable: true })
  rhesusFactor?: RhFactor;
  //   🔹 Who is most affected?
  // •	Women (people) of all ethnicities (but mostly relevant for those planning to have children)
  //   ✅ Conditional Question Trigger
  // Need to ask for all users planning to have children for compatibility logic
  // "Do you know your Rh factor (blood type +/–)?"
  @Property({ nullable: true })
  taySachsTrait?: boolean; // Triggered for Ashkenazi Jewish/French Canadian
  // "Do you carry the Tay-Sachs trait?"

  @Property({ nullable: true })
  cysticFibrosisTrait?: boolean; // Triggered for European descent
  // "Do you carry the CFTR gene?"

  @Property({ nullable: true })
  g6pdDeficiency?: boolean; //  African/Mediterranean/Middle Eastern
}
