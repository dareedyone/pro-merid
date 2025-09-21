export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum YesNo {
  YES = 'yes',
  NO = 'no',
  UNSURE = 'unsure',
}
export enum RhFactor {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  UNSURE = 'unsure',
}

export enum Genotype {
  AA = 'AA',
  AS = 'AS',
  SS = 'SS',
  AC = 'AC',
  SC = 'SC',
  CC = 'CC',
}

export enum InteractionType {
  VIEW = 'view',
  LIKE = 'like',
  REJECT = 'reject',
  UNMATCH = 'unmatch',
  SUPER_LIKE = 'super_like',
  REMATCH_REQUEST = 'rematch_request',
}

export enum ProfileType {
  FRIEND = 'friend',
  DATE = 'date',
}

export enum UnmatchReason {
  NOT_INTERESTED = 'not_interested',
  FOUND_SOMEONE = 'found_someone',
  TAKING_BREAK = 'taking_break',
  NOT_READY = 'not_ready',
  DIFFERENT_GOALS = 'different_goals',
  NO_CONNECTION = 'no_connection',
  INAPPROPRIATE_BEHAVIOR = 'inappropriate_behavior',
  EXPIRED = 'expired',
  OTHER = 'other',
}

export enum InteractionEventType {
  INITIAL_MATCH = 'initial_match',
  REMATCH_ACCEPTED = 'rematch_accepted',
  REMATCH_REJECTED = 'rematch_rejected',
  UNMATCH = 'unmatch',
  REMATCH_REQUEST = 'rematch_request',
}
