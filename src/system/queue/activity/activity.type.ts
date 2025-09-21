export interface ProcessOfflineUsersData {
  timestamp: Date;
  batchSize?: number;
  lastProccessedOfflineUserLastSeenAt?: Date;
  isFirstBatch?: boolean;
  totalProcessed?: number;
  totalEmailsSent?: number;
  totalEmailsSkipped?: number;
}

export interface ProcessUserBatchData {
  userIds: string[];
  timestamp: Date;
}

export interface ProcessSingleUserData {
  userId: string;
  timestamp: Date;
}

export interface ActivityEmailData {
  userId: string;
  newMatches: number;
  totalMatches: number;
  newMessages: number;
  totalMessages: number;
  matchDetails: Array<{
    matchedUserId: string;
    matchedUserName: string;
    matchedAt: Date;
  }>;
}

export interface ActivityTracker {
  userId: string;
  lastSentMatchCount: number;
  lastSentMessageCount: number;
  lastEmailSentAt: Date;
}
