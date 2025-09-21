import { IsString, IsUUID } from 'class-validator';

export class JoinChatDto {
  @IsString()
  @IsUUID()
  chatId: string;
}

export class LeaveChatDto {
  @IsString()
  @IsUUID()
  chatId: string;
}

export class TypingDto {
  @IsString()
  @IsUUID()
  chatId: string;
}

export class MarkReadDto {
  @IsString()
  @IsUUID()
  chatId: string;
}

export class NewMessageEvent {
  chatId: string;
  message: {
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
  };
}

export class UserTypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export class UserStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export class MessagesReadEvent {
  chatId: string;
  userId: string;
  readAt: Date;
}

export class ChatUpdatedEvent {
  chatId: string;
  action: 'message_sent' | 'message_deleted' | 'chat_archived' | 'chat_blocked';
}

export class NewMatchEvent {
  chatId: string;
  matchedUserId: string;
}

export class ChatArchivedEvent {
  chatId: string;
}

export class ErrorEvent {
  message: string;
  code?: string;
}
