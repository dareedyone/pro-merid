import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  Enum,
  DateType,
  Collection,
  ManyToOne,
  ManyToMany,
  Unique,
  Cascade,
  // Embedded,
} from '@mikro-orm/core';
// import { v4 as uuidv4 } from 'uuid';
// todo: uninstall uuid
import { Auth } from '../../../auth/entities/auth.entity';
import {
  DietaryPreference,
  EducationLevel,
  Gender,
  MaritalStatus,
  PetPreference,
  ReligiousLevel,
  SexualOrientation,
  SubstanceStatus,
} from 'src/common/types/enums/user.enum';
import { Profession } from './character/profession.entity';
import { Ethnic } from '../../../location/entities/ethnic.entity';
import { ReligionSect } from './character/religion-sect.entity';
import { Interest } from './character/interest.entity';
import { Country } from '../../../location/entities/country.entity';
import { FriendProfile } from '../profile/friend.profile';
// import { RangeEmb } from 'src/common/entities/range.emb';
import { Anchor } from './anchor.entity';
import { DatingProfile } from 'src/feature/dating/entities/dating.profile';

@Entity()
export class User {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => Auth, (auth) => auth.user, {
    cascade: [Cascade.ALL],
  })
  auth!: Auth;

  @ManyToOne(() => Anchor, { nullable: true })
  anchor?: Anchor;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  displayName!: string;

  @Property({ type: DateType })
  dob!: Date;

  @Property({ nullable: true })
  @Unique()
  phone?: string;
  // todo different phone numbers for different countries/profiles ?
  // have a field for university - only for display

  @ManyToOne(() => Profession)
  profession?: Profession;

  @Enum({ items: () => EducationLevel, default: EducationLevel.UNKNOWN })
  educationLevel!: EducationLevel;

  // @ManyToOne(() => Religion)
  // religion?: Religion;

  @ManyToOne(() => ReligionSect, { nullable: true })
  religionSect?: ReligionSect;
  // todo, leave only religionSect as it will already have religion

  @Property({ nullable: true, type: 'boolean' })
  isReligionConvert?: boolean;

  @Enum({ items: () => ReligiousLevel })
  religiousLevel: ReligiousLevel;

  @ManyToOne(() => Ethnic)
  ethnicity?: Ethnic;

  @ManyToOne(() => Country)
  originCountry?: Country;

  @ManyToOne(() => Country)
  grewUpIn?: Country;

  @ManyToMany(() => Country)
  nationalities = new Collection<Country>(this);

  @Enum({ items: () => Gender, default: Gender.UNKNOWN })
  gender!: Gender;

  @Enum({ items: () => SexualOrientation, default: SexualOrientation.UNKNOWN })
  sexualOrientation!: SexualOrientation;

  // @Enum({ items: () => Gender, array: true, default: [] })
  // interestedIn!: Gender[];

  @Enum({ items: () => MaritalStatus, default: MaritalStatus.UNKNOWN })
  maritalStatus!: MaritalStatus;

  // @Embedded(() => RangeEmb)
  // children = new RangeEmb();

  @Enum({
    items: () => PetPreference,
    default: PetPreference.NONE,
    nullable: true,
  })
  petPreference?: PetPreference;

  @Property({ nullable: true })
  children?: number;

  @Enum({
    items: () => DietaryPreference,
    default: DietaryPreference.OTHER,
  })
  diet!: DietaryPreference;

  @ManyToMany(() => Interest)
  interests = new Collection<Interest>(this);

  // @Property({ default: false, type: 'boolean' })
  // emailVerified?: boolean = false;

  // @Property({ default: false, type: 'boolean' })
  // phoneVerified?: boolean = false; //todo: offload ids for other countries id

  @Property({ nullable: true })
  isFaceVerified?: boolean = false; // todo handle face verification

  @Property({ nullable: true })
  ageVerified?: boolean = false;

  @Enum({ items: () => SubstanceStatus, default: SubstanceStatus.UNKNOWN })
  smokingStatus: SubstanceStatus;

  @Enum({ items: () => SubstanceStatus, default: SubstanceStatus.UNKNOWN })
  drinkingStatus: SubstanceStatus;

  @Enum({ items: () => SubstanceStatus, default: SubstanceStatus.UNKNOWN })
  drugUseStatus: SubstanceStatus;

  @Property({ default: false, nullable: true })
  isCeleb?: boolean = false;

  @Property({ default: true, type: 'boolean' })
  isActivated?: boolean = true;

  @OneToOne(() => DatingProfile, (datingProfile) => datingProfile.user, {
    cascade: [Cascade.ALL],
  })
  datingProfile?: DatingProfile;

  @OneToOne(() => FriendProfile, (friendProfile) => friendProfile.user, {
    cascade: [Cascade.ALL],
  })
  friendProfile?: FriendProfile;

  @Property({ nullable: true })
  createdAt? = new Date();

  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt? = new Date();
}

// note: do not need to split user into different profiles since anchor and admin would not require first and last name.

// add validation
// npx mikro-orm seeder:create test --context=postgres

// types of profiles are: basedProfile - date, originProfile -date, adminProfile, anchorProfile, socialProfile
// basedProfile and originProfile will have about the same data
// adminProfile - no data
// anchorProfile - picture, info about services rendered, access to follow up and schedule meeting, also control user onboarding options.
// socialProfile - some data  like location, birthday aand pictures
// marriage info can be part of dateProfile or have dedicated marriageProfile and interestProfile (filtering)
// todo: think of user roles as well e.g  admin, user, moderator, anchor
// todo: marriage profile - can they convert religion for marriage and what religion - should be  asked after if religion matters
// permanently save verification image - this is because they can change it later - so we can always know the profile owner in case of fraud

// do we want to auto verify age from id ?
// next:
// friends
// chat/messages
// events
