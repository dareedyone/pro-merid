import { ProfileType } from 'src/common/types/enums/other.enum';

export class ChatParticipantDto {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export class ChatMessageDto {
  id: string;
  senderId: string;
  senderProfileId: string;
  text: string;
  type: string;
  replyTo?: string;
  mediaUrl?: string;
  mediaType?: string;
  reactions: Array<{
    emoji: string;
    userId: string;
    userProfileId: string;
  }>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatResponseDto {
  id: string;
  matchId: string;
  profileType: ProfileType;
  name: string;
  avatar?: string;
  participants: ChatParticipantDto[];
  profileIds: string[];
  createdBy: string;
  lastMessage?: ChatMessageDto;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatListResponseDto {
  chats: ChatResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class MessageListResponseDto {
  messages: ChatMessageDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
