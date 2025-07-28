export enum Gender {
  // STRAIGHT-ONLY POOL (Binary, cisgender-only)
  MAN = 'Man', // Biological males identifying as men
  WOMAN = 'Woman', // Biological females identifying as women

  // QUEER-ONLY POOL (All non-cishet identities)
  TRANS_MAN = 'Trans Man', // Female-to-male transgender
  TRANS_WOMAN = 'Trans Woman', // Male-to-female transgender
  NON_BINARY = 'Non-binary', // Rejects male/female binary
  GENDERQUEER = 'Genderqueer', // Non-traditional identity
  OTHER = 'Other', // Catch-all for unlisted identities

  UNKNOWN = 'Unknown', // Privacy option
}

export enum UserType {
  USER = 'user',
  ADMIN = 'admin',
  SUPPORT = 'support',
  ANCHOR = 'anchor', // optional: if you want anchor to have dashboard access
}

export enum SexualOrientation {
  // STRAIGHT POOL RULES
  STRAIGHT = 'Straight', // Hard-coded to MAN↔WOMAN only

  // QUEER POOL RULES
  // Male-aligned attracted to male-aligned
  GAY = 'Gay', // Exclusive to MALE-ALIGNED:
  // - Man
  // - Trans Man
  // - Demiboy
  // - Non-binary (male-leaning)

  // Female-aligned attracted to female-aligned
  LESBIAN = 'Lesbian', // Exclusive to FEMALE-ALIGNED:
  // - Woman
  // - Trans Woman
  // - Demigirl
  // - Non-binary (female-leaning)

  BI_PAN = 'Bi/Pan', // Attraction across queer gender spectrum - All LGBTQ+ genders
  ASEXUAL = '🌈Asexual', // Special case (romantic-only matching)

  UNKNOWN = 'Unknown',
}

// You simplified the Gender enum to enforce a strict separation between straight and LGBTQ+ matching pools, which serves several key purposes for your dating app:

// 1. Binary Straight Pool (For Traditional Dating)
// Only includes MAN and WOMAN:

// Explicitly for cisgender, heterosexual users who want traditional male-female matching.

// Excludes trans/non-binary genders to avoid mismatches with users who only want to date biological sexes.

// 2. Dedicated LGBTQ+ Pool (For Queer Matching)
// Consolidated non-binary and trans identities:

// TRANS_MAN/TRANS_WOMAN: For binary trans people.

// NON_BINARY/GENDERQUEER: For non-traditional genders.

// OTHER: Catch-all for rare identities.

// Removed niche terms like DEMIBOY, TWO_SPIRIT to reduce complexity.

// 3. Why You Made These Changes
// Avoid ambiguity: Straight users won’t see trans/non-binary profiles.

// Simplify matching: LGBTQ+ users can match freely within their pool.

// Reduce friction: No confusing overlaps between identities.

// 4. What Was Removed (And Why)
// Original Term	Removed Because
// GENDERFLUID	Merged into GENDERQUEER/NON_BINARY
// DEMIBOY/DEMIGIRL	Too niche for most dating pools
// TWO_SPIRIT	Culturally specific (unless your app targets Indigenous users)
// BIGENDER	Overlaps with NON_BINARY
// 5. Key Benefits of the Simplified Enum
// Straight users: Get a traditional dating experience with no LGBTQ+ visibility.

// LGBTQ+ users: Can match with anyone in their pool (trans, non-binary, etc.).

// Clear boundaries: No accidental cross-pool matches.

// How This Aligns With Your Goals
// You wanted strict separation between straight and queer users.

// You prioritized clarity over granularity (e.g., collapsing similar gender identities).

// You ensured trans people are correctly categorized (trans men/woman in LGBTQ+ pool).

// Would you like to add profile badges (e.g., "Straight Pool" vs. "LGBTQ+ Pool") to make this even clearer to users?

// export enum InterestedIn {
//   MAN = Gender.MAN,
//   WOMAN = Gender.WOMAN,
//   TRANS_MAN = Gender.TRANS_MAN,
//   TRANS_WOMAN = Gender.TRANS_WOMAN,
//   NON_BINARY = Gender.NON_BINARY,
//   GENDERFLUID = Gender.GENDERFLUID,
//   AGENDER = Gender.AGENDER,
//   DEMIBOY = Gender.DEMIBOY,
//   DEMIGIRL = Gender.DEMIGIRL,
//   TWO_SPIRIT = Gender.TWO_SPIRIT,
//   BIGENDER = Gender.BIGENDER,
//   OTHER = Gender.OTHER,
//   EVERYONE = 'Everyone',
//   UNKNOWN = 'Unknown',
// }
// todo, for USA on client side only use man and woman.- use gender based on country law
export enum BodyType {
  UNKNOWN = -1, // Not specified
  SLIM = 1, // Low body fat, narrow build
  ATHLETIC = 2, // Toned, moderate muscle (e.g., runner/swimmer)
  MUSCULAR = 3, // High muscle mass (e.g., weightlifter)
  BROAD = 4, // Wide shoulders/hips (bone structure)
  ROUND = 5, // Higher body fat, even distribution
  LARGE = 6, // Bigger overall body mass
  OTHER = 7, // Custom/user-defined
}

export enum FinancialAttitudeType {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default)
  INVESTOR = 1, // Most responsible, growth-oriented
  FRUGAL = 2, // Financially responsible, focused on saving
  BALANCED = 3, // Reasonable approach to both saving and spending
  SPENDER = 4, // Least financially responsible, focused on immediate enjoyment
}

export enum HonestyType {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default)
  BRUTALLY_HONEST = 1, // Always tells the truth, even if harsh
  HONEST_BUT_TACTFUL = 2, // Honest but considers others’ feelings
  OCCASIONAL_WHITE_LIES = 3, // Will bend the truth sometimes
  PEOPLE_PLEASER = 4, // Prioritizes avoiding conflict over honesty
}

export enum KindnessType {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default),
  GUARDIAN_ANGEL = 1, // Always there to help, no matter what
  WARM_HEART = 2, // Spreads kindness when possible
  FAIR_DEALER = 3, // Kind when it makes sense, but not always
  REALIST = 4, // I value kindness but also focus on practicality
}

export enum GenerousType {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default),
  PHILANTHROPIST = 1, // Giving generously without hesitation.
  SUPPORTER = 2, // Thoughtfully giving when it’s needed.
  PRACTICAL_GIVER = 3, // Sharing only when it makes sense.
  SAVER = 4, // Prioritizing my own needs over giving.
}

export enum UprightnessType {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default)
  MORAL_BEACON = 1, // Always stands by integrity, no exceptions
  PRINCIPLED = 2, // Follows strong ethics but considers nuance
  FLEXIBLE_ETHICIST = 3, // Has morals but bends rules when necessary
  OPPORTUNIST = 4, // Prioritizes personal gain over strict ethics
}

export enum PrimaryGuidePhilosophy {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default)
  RELIGION = 1, // beliefs and spiritual values come first
  HUMANITY = 2, // Compassion and human well-being guide me most
  BALANCED = 3,
  OTHER = 4, // todo: people soubmit and we update. We need an update for submission
}

export enum PoliticialView {
  PREFER_NOT_TO_SAY = -1, // Neutral option (default)
  APOLITICAL = 1, // don’t get too involved or at all
  CENTRIST = 2, // look for balance and fairness in both sides
  LIBERAL = 3, // passionate about social change and justice
  CONSERVATIVE = 4, // preserving tradition and keeping things stable
}

export enum DressSenseWomen {
  PREFER_NOT_TO_SAY = -1, // Neutral option
  FULL_COVERED = 1, // Most desirable in conservative/religious circles (e.g., Niqab, Burqa)
  MODEST_HEAD_COVERED = 2, // Highly valued, modest with head always covered (e.g., hijab)
  MODEST = 3, // Well-accepted, covered but stylish
  TRENDY_STYLISH = 4, // Fashion-forward, modern appeal
  SEXY_CONFIDENT = 5, // Attractive in general dating but not in modest circles
  EDGY_EXPERIMENTAL = 6, // Least mainstream, niche appeal (e.g., alternative fashion)
}

export enum DressSenseMen {
  PREFER_NOT_TO_SAY = -1, // Neutral option

  SMART_CLASSY = 1, // Most desirable – polished, well-dressed (suits, blazers, etc.)
  TRENDY_FASHIONABLE = 2, // Highly desirable – modern and stylish
  CASUAL_PUT_TOGETHER = 3, // Attractive but laid-back – relaxed yet stylish
  TRADITIONAL_CULTURAL = 4, // Appreciated but dependent on personal/cultural preference
  BOLD_STATEMENT = 5, // Hit or miss – some love bold fashion, others dislike it
  LAID_BACK_BASIC = 6, // Least desirable – minimal effort in dressing (e.g., plain tees & sweatpants)
}

export enum CleanlinessType {
  PREFER_NOT_TO_SAY = -1, // Neutral option

  IMPECCABLE_NEAT_FREAK = 1, // Extremely clean, everything is spotless
  WELL_GROOMED_ORGANIZED = 2, // Most desirable—clean, well-kept, and tidy
  CASUALLY_CLEAN = 3, // Clean but relaxed, not overly meticulous
  LAID_BACK_APPROACH = 4, // Prioritizes comfort over tidiness, but not dirty
  RELAXED_CLEANLINESS = 5, // Least desirable—prefers a carefree approach to hygiene
}

export const BodyTypeTextMap = new Map<BodyType, string>([
  [BodyType.UNKNOWN, 'Unknown'],
  [BodyType.SLIM, 'Slim'],
  [BodyType.ATHLETIC, 'Athletic'],
  [BodyType.MUSCULAR, 'Muscular'],
  [BodyType.BROAD, 'Broad'],
  [BodyType.ROUND, 'Round'],
  [BodyType.LARGE, 'Large'],
  [BodyType.OTHER, 'Other'],
]);

export enum SubstanceStatus {
  UNKNOWN = -1, // Unspecified status (ranked first for neutrality)
  NEVER = 1, // Never used the substance
  ABSTAINER = 2, // Tried but never regularly used
  QUIT = 3, // Former regular user who stopped
  WANT_TO_QUIT = 4, // Actively trying to quit current use
  SOCIAL = 5, // Low-frequency, low-quantity (e.g., parties)
  MODERATE = 6, // Irregular but higher-quantity use
  FREQUENTLY = 7, // High-frequency, high-quantity use
}

export const SubstanceStatusTextMap = new Map<SubstanceStatus, string>([
  [SubstanceStatus.UNKNOWN, 'Unknown'],
  [SubstanceStatus.NEVER, 'Never Used'],
  [SubstanceStatus.ABSTAINER, 'Abstainer (Tried but Don’t Use)'],
  [SubstanceStatus.QUIT, 'Quit (Former User)'],
  [SubstanceStatus.WANT_TO_QUIT, 'Wants to Quit'],
  [SubstanceStatus.SOCIAL, 'Social User'],
  [SubstanceStatus.MODERATE, 'Moderate User'],
  [SubstanceStatus.FREQUENTLY, 'Frequent User'],
]);

export enum MaritalStatus {
  SINGLE = 'Single', // Never married
  DIVORCED = 'Divorced', // Legally dissolved marriage
  WIDOWED = 'Widowed', // Partner passed away
  SEPARATED = 'Separated', // Legally married but living apart
  PARTNERED = 'Partnered', // Committed relationship (non-married, e.g., life partner)
  MARRIED = 'Married', // Currently legally married
  POLYGAMOUS = 'Polygamous', // In a multi-spouse marriage (polygyny, polyandry, or group marriage)
  UNKNOWN = 'Unknown', // Not disclosed
}

export enum DateIntention {
  MARRIAGE = 'Marriage', // Looking for a lifelong spouse
  SERIOUS_RELATIONSHIP = 'Serious Relationship', // Long-term commitment (marriage possible)
  LIFE_PARTNERSHIP = 'Life Partnership', // Committed but not necessarily marriage
  OPEN_RELATIONSHIP = 'Open Relationship', // Ethical non-monogamy but not necessarily polyamorous
  POLYAMORY = 'Polyamory', // Multiple ethical romantic/sexual relationships - - use text map as married and seeking another spouse todo
  CASUAL_FUN = 'Casual/Fun', // Short-term, low-commitment, or just enjoying the moment
  FRIENDSHIP = 'Friendship', // Seeking platonic connections - if selected tell them community is comming soon todo
  // UNDECIDED = 'Undecided', // Open but unsure
  // OTHER = 'Other', // Covers unique preferences
  UNKNOWN = 'Unknown', // Not disclosed
}
// todo: calculate based on marital status + intention e.g Married + Marriage = Polygamous

export enum RelationshipBeliefType {
  PREFER_NOT_TO_SAY = -1, // Neutral option
  TRADITIONAL = 1, // Believes in structured relationships, often marriage-focused, may include religious values.
  SEMI_TRADITIONAL = 2, // Leans traditional but open to modern flexibility.
  MODERN = 3, // Believes in equal partnerships, shared responsibilities, and personal choice.
  PROGRESSIVE = 4, // Strongly rejects traditional norms, emphasizes complete equality and fluid relationship roles.
  UNCONVENTIONAL = 5, // Open to alternative relationship structures (e.g., polyamory, open relationships, relationship anarchy).
}

export enum IntimacyBeliefType {
  PREFER_NOT_TO_SAY = -1, // Chooses to remain private
  WAIT_UNTIL_MARRIAGE = 1, // Has always believed in abstinence until marriage
  NOW_WAITING_UNTIL_MARRIAGE = 2, // May have been active but now committed to waiting
  EMOTIONAL_AND_PHYSICAL = 3, // Sees intimacy as a natural part of a healthy relationship
}

// export enum PartnerIntimacyPreferenceType {
//   PREFER_NOT_TO_SAY = -1, // Default or neutral
//   STRICTLY_WAITED = 1, // Prefers someone who has always waited
//   NOW_COMMITTED_IS_OK = 2, // Open to someone who didn’t wait, but is now committed
//   FLEXIBLE = 3, // Doesn’t mind either way
// }

export enum LoveLanguageType {
  WORDS_OF_AFFIRMATION = 'WordsOfAffirmation', // Compliments, verbal affection
  ACTS_OF_SERVICE = 'ActsOfService', // Helping out
  RECEIVING_GIFTS = 'ReceivingGifts', // Thoughtful items
  QUALITY_TIME = 'QualityTime', // Time spent together
  PHYSICAL_TOUCH = 'PhysicalTouch', // Cuddles, holding hands, etc.
}

export enum WantsKidsType {
  PREFER_NOT_TO_SAY = -1, // Neutral / undisclosed
  NONE = 0, // Doesn't want children
  ONE = 1, // Wants exactly one
  ONE_TO_TWO = 2, // Wants 1–2 children
  THREE_TO_FIVE = 5, // Wants 3–5 children
  FIVE_PLUS = 6, // Wants 5+ children
}

export enum ParentingStyleType {
  PREFER_NOT_TO_SAY = -1, // Neutral / undisclosed
  SUPPORTIVE = 1, // Supportive and nurturing—focusing on emotional growth
  BALANCED = 2, // Balanced—guidance with flexibility
  RELAXED = 3, // Relaxed—more laid-back and allowing kids to explore
  STRICT = 4, // Strict and disciplined—rules are essential for structure
}

// export enum MaritalTimelineType {
//   READY_FOR_MARRIAGE_SOON = 1, // Within months
//   DATING_1_TO_2_YEARS = 2, // 1 to 2 years
//   DATING_3_TO_5_YEARS = 3, // 3–5 years
//   PREFER_NOT_TO_SAY = -1, // Prefer not to say
// }

export enum MaritalTimelineType {
  MAX_1 = 1,
  MAX_2 = 2,
  MAX_3 = 3,
  FROM_4 = 4, // 4+ years
  PREFER_NOT_TO_SAY = -1,
}

export enum EducationLevel {
  UNKNOWN = -1, // Not disclosed (hidden in UI)
  POSTDOCTORAL = 1, // Highest rank (e.g., fellowships)
  DOCTORATE = 2, // PhD, MD, JD, etc.
  MASTER = 3, // Master's degree
  BACHELOR = 4, // Bachelor's degree
  ASSOCIATE = 5, // Associate degree
  VOCATIONAL = 6, // Trade school/certification
  SECONDARY = 7, // High school diploma (merged HIGH_SCHOOL here)
  PRIMARY = 8, // Elementary/middle school
  OTHER = 9, // Catch-all (e.g., self-taught, non-accredited)
  NO_FORMAL_EDUCATION = 10, // No schooling
}

export const EducationLevelMap = new Map<number, string>([
  [EducationLevel.POSTDOCTORAL, 'Postdoctoral'],
  [EducationLevel.DOCTORATE, 'Doctorate (PhD/MD/JD)'],
  [EducationLevel.MASTER, "Master's Degree"],
  [EducationLevel.BACHELOR, "Bachelor's Degree"],
  [EducationLevel.ASSOCIATE, 'Associate Degree'],
  [EducationLevel.VOCATIONAL, 'Vocational/Trade School'],
  [EducationLevel.SECONDARY, 'High School Diploma'],
  [EducationLevel.PRIMARY, 'Primary Education'],
  [EducationLevel.NO_FORMAL_EDUCATION, 'No Formal Education'],
  [EducationLevel.OTHER, 'Other'],
  [EducationLevel.UNKNOWN, 'Unknown'], // Hide in UI or label "Prefer not to say"
]);

export enum ReligiousLevel {
  DEVOUT = 1, // Strict, unwavering observance (e.g., prays 5x/day, follows all rules)
  COMMITTED = 2, // Regular practice, but adapts minor rules (e.g., attends weekly worship)
  MODERATE = 3, // Selective observance (e.g., celebrates holidays but ignores some doctrines)
  NOMINAL = 4, // Identifies but rarely practices (e.g., "Christmas/Easter Christian")
  NON_PRACTICING = 5, // No observance, but may still identify culturally
}

export const ReligiousLevelText: Record<ReligiousLevel, string> = {
  [ReligiousLevel.DEVOUT]: 'Devout',
  [ReligiousLevel.COMMITTED]: 'Committed',
  [ReligiousLevel.MODERATE]: 'Moderate',
  [ReligiousLevel.NOMINAL]: 'Nominal',
  [ReligiousLevel.NON_PRACTICING]: 'Non-practicing',
};

export enum DietaryPreference {
  // Tier 1: Strict Dealbreakers (Religious & Ethical)
  VEGAN = 'Vegan', // 🌱 Completely plant-based; no meat, dairy, eggs, or honey. Often an ethical choice.
  HALAL = 'Halal', // 🕌 Follows Islamic dietary laws; no pork or alcohol, and only Halal-certified meat.
  KOSHER = 'Kosher', // ✡️ Follows Jewish dietary laws; no pork, no shellfish, and no mixing meat & dairy.
  JAIN_VEGETARIAN = 'Jain Vegetarian', // 🪔 No meat, eggs, honey, or root vegetables (e.g., onions, garlic). Very strict.
  HINDU_VEGETARIAN = 'Hindu Vegetarian', // 🕉️ No beef; many follow a fully vegetarian diet due to religious beliefs.
  CARNIVORE = 'Carnivore', // 🥩 Primarily or exclusively eats meat. Often a lifestyle choice, can be a dealbreaker for plant-based eaters.

  // Tier 2: Flexible (Health/Personal)
  GLUTEN_FREE = 'Gluten-Free', // ⚠️ Avoids gluten (found in wheat, barley, rye); crucial for celiacs, optional for others.
  DAIRY_FREE = 'Dairy-Free', // 🥛 No milk, cheese, or dairy products; may be due to lactose intolerance or ethical reasons.
  PESCATARIAN = 'Pescatarian', // 🐟 No meat except for fish and seafood; often a stepping stone to vegetarianism.
  FLEXITARIAN = 'Flexitarian', // 🌿 Mostly plant-based but occasionally eats meat; flexible approach to diet.

  // Tier 3: Catch-All Category
  OTHER = 'Other', // ❓ Any dietary preference not listed here; users can specify further in their profile.
}
export enum LocationType {
  BASED = 1,
  NATIONALITY = 2,
  ORIGIN = 3,
  GREWUP = 4,
}

export enum PetPreference {
  DOGS_ONLY = 'DOGS_ONLY',
  CATS_ONLY = 'CATS_ONLY',
  ALL_PETS = 'ALL_PETS',
  NO_PETS = 'NO_PETS',
  NONE = 'NONE',
}

export enum SpouseFriendshipType {
  MUST_BE_BEST_FRIEND = 1, // Spouse = best friend
  CLOSE_PARTNER_BUT_NOT_BFF = 2, // Strong connection, separate best friends
  ROMANTIC_NOT_FRIEND = 3, // Prioritizes romance over friendship
  PREFER_NOT_TO_SAY = -1, // Undisclosed / unsure
}

// export enum FriendshipIntention {
//   ACTIVITY = 'activity',
//   EMOTIONAL = 'emotional',
//   SOCIAL = 'social',
// }

export enum VerificationType {
  PICTURE = 'picture',
  ID = 'id',
  OTHER = 'Other',
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}
