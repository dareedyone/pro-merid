import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, ChatStatus } from './entities/chat.entity';
import {
  Message,
  MessageDocument,
  MessageType,
  MessageStatus,
} from './entities/message.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ChatResponseDto,
  ChatListResponseDto,
  MessageListResponseDto,
  ChatMessageDto,
} from './dto/chat-response.dto';
import {
  AddReactionDto,
  RemoveReactionDto,
  ReplyToMessageDto,
  ReactionResponseDto,
} from './dto/reaction.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionLimitsService } from './subscription-limits.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly subscriptionLimitsService: SubscriptionLimitsService,
  ) {}

  async createChat(
    createChatDto: CreateChatDto,
    userId: string,
    isPremium: boolean = false,
    isTrueFynd: boolean = false,
  ): Promise<ChatResponseDto> {
    const existingChat = await this.chatModel.findOne({
      matchId: createChatDto.matchId,
      profileType: createChatDto.profileType,
      status: { $ne: ChatStatus.DELETED },
    });

    if (existingChat) {
      return this.mapChatToResponseDto(existingChat);
    }

    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      createChatDto.profileType,
      isPremium,
      isTrueFynd,
    );
    await this.subscriptionLimitsService.checkChatLimit(
      userId,
      createChatDto.profileType,
      limits,
    );

    const chat = new this.chatModel({
      ...createChatDto,
      createdBy: userId,
      status: ChatStatus.ACTIVE,
    });

    const savedChat = await chat.save();
    return this.mapChatToResponseDto(savedChat);
  }

  async getChats(
    userId: string,
    profileType: ProfileType,
    page: number = 1,
    limit: number = 20,
  ): Promise<ChatListResponseDto> {
    const skip = (page - 1) * limit;

    const chats = await this.chatModel
      .find({
        participantIds: { $in: [userId] },
        profileType,
        status: { $ne: ChatStatus.DELETED },
      })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.chatModel.countDocuments({
      participantIds: { $in: [userId] },
      profileType,
      status: { $ne: ChatStatus.DELETED },
    });

    const chatResponses = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await this.getLastMessage(chat._id.toString());
        const unreadCount = chat.unreadCount.get(userId) || 0;

        return {
          ...this.mapChatToResponseDto(chat),
          lastMessage: lastMessage || undefined,
          unreadCount,
        };
      }),
    );

    return {
      chats: chatResponses,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Internal method to get chat without user verification (for system operations)
   */
  async getChatInternal(chatId: string): Promise<ChatDocument> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      status: { $ne: ChatStatus.DELETED },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async getChat(chatId: string, userId: string): Promise<ChatResponseDto> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
      status: { $ne: ChatStatus.DELETED },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const lastMessage = await this.getLastMessage(chatId);
    const unreadCount = chat.unreadCount.get(userId) || 0;

    return {
      ...this.mapChatToResponseDto(chat),
      lastMessage: lastMessage || undefined,
      unreadCount,
    };
  }

  async sendMessage(
    sendMessageDto: SendMessageDto,
    userId: string,
    userProfileId: string,
    isPremium: boolean = false,
    isTrueFynd: boolean = false,
  ): Promise<ChatMessageDto> {
    let chat;
    if (!sendMessageDto.chatId) {
      if (!sendMessageDto.targetUserId || !sendMessageDto.profileType) {
        throw new BadRequestException(
          'targetUserId and profileType are required for new conversations',
        );
      }

      chat = await this.createChatForNewConversation(
        userId,
        userProfileId,
        sendMessageDto.targetUserId,
        sendMessageDto.profileType,
        isPremium,
        isTrueFynd,
      );
      sendMessageDto.chatId = chat.id;
    } else {
      chat = await this.chatModel.findOne({
        _id: sendMessageDto.chatId,
        participantIds: { $in: [userId] },
        status: ChatStatus.ACTIVE,
      });

      if (!chat) {
        throw new NotFoundException('Chat not found or access denied');
      }
    }

    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      chat.profileType,
      isPremium,
      isTrueFynd,
    );

    await this.subscriptionLimitsService.checkMessageLength(
      sendMessageDto.text,
      limits,
    );

    await this.subscriptionLimitsService.checkMessageLimit(
      userId,
      chat.profileType,
      limits,
    );

    if (sendMessageDto.type) {
      await this.subscriptionLimitsService.checkMediaPermission(
        sendMessageDto.type,
        limits,
      );
    }

    if (sendMessageDto.type === MessageType.LOCATION) {
      await this.subscriptionLimitsService.checkLocationPermission(
        sendMessageDto.type,
        limits,
      );
    }

    const message = new this.messageModel({
      chat: sendMessageDto.chatId,
      senderId: userId,
      senderProfileId: userProfileId,
      text: sendMessageDto.text,
      type: sendMessageDto.type || MessageType.TEXT,
      replyTo: sendMessageDto.replyTo,
      mediaUrl: sendMessageDto.mediaUrl,
      mediaType: sendMessageDto.mediaType,
      status: MessageStatus.SENT,
    });

    const savedMessage = await message.save();

    await this.chatModel.updateOne(
      { _id: sendMessageDto.chatId },
      {
        lastMessageAt: (savedMessage as any).createdAt,
        lastMessageId: savedMessage._id.toString(),
        $inc: {
          [`unreadCount.${(chat as any).participantIds.find((id: string) => id !== userId)}`]: 1,
        },
      },
    );

    return this.mapMessageToResponseDto(savedMessage);
  }

  async getMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessageListResponseDto> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
      status: { $ne: ChatStatus.DELETED },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({
        chat: chatId,
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.messageModel.countDocuments({
      chat: chatId,
      isDeleted: false,
    });

    const messageResponses = messages.map((msg) =>
      this.mapMessageToResponseDto(msg),
    );

    return {
      messages: messageResponses.reverse(), // Reverse to get chronological order
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async markAsRead(
    chatId: string,
    userId: string,
    userProfileId: string,
  ): Promise<void> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
      status: { $ne: ChatStatus.DELETED },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    await this.messageModel.updateMany(
      {
        chat: chatId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
      },
      {
        $push: {
          readBy: {
            userId,
            userProfileId,
            readAt: new Date(),
          },
        },
        $set: {
          status: MessageStatus.READ,
        },
      },
    );

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $set: {
          [`unreadCount.${userId}`]: 0,
          [`lastSeen.${userId}`]: new Date(),
        },
      },
    );
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $set: {
          status: ChatStatus.DELETED,
        },
      },
    );
  }

  async archiveChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
      status: ChatStatus.ACTIVE,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $set: {
          status: ChatStatus.ARCHIVED,
          archivedAt: new Date(),
          archivedBy: userId,
        },
      },
    );
  }

  async unarchiveChat(chatId: string, userId: string): Promise<void> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
      status: ChatStatus.ARCHIVED,
    });

    if (!chat) {
      throw new NotFoundException('Archived chat not found or access denied');
    }

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $set: {
          status: ChatStatus.ACTIVE,
          archivedAt: null,
          archivedBy: null,
        },
      },
    );
  }

  async blockChat(
    chatId: string,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [userId] },
      status: { $ne: ChatStatus.DELETED },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    await this.chatModel.updateOne(
      { _id: chatId },
      {
        $set: {
          status: ChatStatus.BLOCKED,
          blockedAt: new Date(),
          blockedBy: userId,
          blockReason: reason,
        },
      },
    );
  }

  private async getLastMessage(chatId: string): Promise<ChatMessageDto | null> {
    const lastMessage = await this.messageModel
      .findOne({
        chat: chatId,
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    return lastMessage ? this.mapMessageToResponseDto(lastMessage) : null;
  }

  private mapChatToResponseDto(chat: ChatDocument): ChatResponseDto {
    return {
      id: chat._id.toString(),
      matchId: chat.matchId,
      profileType: chat.profileType,
      name: chat.name,
      avatar: chat.avatar,
      participants: [], // This would be populated with user details
      profileIds: chat.profileIds,
      createdBy: chat.createdBy,
      isActive: chat.status === ChatStatus.ACTIVE,
      unreadCount: 0, // This will be set by the caller
      createdAt: (chat as any).createdAt,
      updatedAt: (chat as any).updatedAt,
    };
  }

  private mapMessageToResponseDto(message: MessageDocument): ChatMessageDto {
    return {
      id: message._id.toString(),
      senderId: message.senderId,
      senderProfileId: message.senderProfileId,
      text: message.text,
      type: message.type,
      replyTo: message.replyTo?.toString(),
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      reactions: message.reactions.map((reaction) => ({
        emoji: reaction.emoji,
        userId: reaction.userId,
        userProfileId: reaction.userProfileId,
      })),
      isDeleted: message.isDeleted,
      createdAt: (message as any).createdAt,
      updatedAt: (message as any).updatedAt,
    };
  }

  async getUsageStats(userId: string, profileType: ProfileType) {
    return this.subscriptionLimitsService.getUsageStats(userId, profileType);
  }

  async getUpgradeRecommendation(
    userId: string,
    profileType: ProfileType,
    isPremium: boolean,
    isTrueFynd: boolean,
  ) {
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      profileType,
      isPremium,
      isTrueFynd,
    );
    return this.subscriptionLimitsService.getUpgradeRecommendation(
      userId,
      profileType,
      limits,
    );
  }

  async checkReactionPermission(
    userId: string,
    profileType: ProfileType,
    isPremium: boolean,
    isTrueFynd: boolean,
  ) {
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      profileType,
      isPremium,
      isTrueFynd,
    );
    await this.subscriptionLimitsService.checkReactionPermission(limits);
  }

  async checkReplyPermission(
    userId: string,
    profileType: ProfileType,
    isPremium: boolean,
    isTrueFynd: boolean,
  ) {
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      profileType,
      isPremium,
      isTrueFynd,
    );
    await this.subscriptionLimitsService.checkReplyPermission(limits);
  }

  // Create chat for new conversation (when first message is sent)
  private async createChatForNewConversation(
    userId: string,
    userProfileId: string,
    targetUserId: string,
    profileType: ProfileType,
    isPremium: boolean,
    isTrueFynd: boolean,
  ): Promise<ChatResponseDto> {
    // Check if users have matched (for dating) or are friends (for friends)
    const isMatch = await this.checkIfUsersCanChat(
      userId,
      targetUserId,
      profileType,
    );

    if (!isMatch) {
      throw new BadRequestException(
        'Users must match or be friends to start a conversation',
      );
    }

    // Generate unique match ID for the chat
    const matchId = `${userProfileId}-${targetUserId}-${profileType}`;

    // Check if chat already exists
    const existingChat = await this.chatModel.findOne({
      matchId,
      profileType,
      status: { $ne: ChatStatus.DELETED },
    });

    if (existingChat) {
      return this.mapChatToResponseDto(existingChat);
    }

    // Check subscription limits
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      profileType,
      isPremium,
      isTrueFynd,
    );
    await this.subscriptionLimitsService.checkChatLimit(
      userId,
      profileType,
      limits,
    );

    // Create new chat
    const chat = new this.chatModel({
      matchId,
      profileType,
      participantIds: [userId, targetUserId],
      profileIds: [userProfileId, targetUserId], // This will need to be updated with actual profile IDs
      name: `Chat ${userId}-${targetUserId}`, // Will be updated with actual names
      createdBy: userId,
      status: ChatStatus.ACTIVE,
    });

    const savedChat = await chat.save();

    return this.mapChatToResponseDto(savedChat);
  }

  // Check if users can chat (matched for dating, friends for friends)
  private async checkIfUsersCanChat(
    _userId1: string,
    _userId2: string,
    _profileType: ProfileType,
  ): Promise<boolean> {
    // This would need to be implemented based on your match/friend system
    // For now, return true - you'll need to implement the actual logic
    return true;
  }

  // Get chat by match ID
  async getChatByMatchId(matchId: string): Promise<ChatDocument | null> {
    return this.chatModel.findOne({ matchId, status: ChatStatus.ACTIVE });
  }

  // Get message count for a chat
  async getMessageCount(chatId: string): Promise<number> {
    return this.messageModel.countDocuments({
      chat: chatId,
      isDeleted: false,
    });
  }

  // Continue existing chat from re-match with new message
  async continueChatFromRematch(
    matchId: string,
    rematchMessage: string,
    senderId: string,
    senderProfileId: string,
  ): Promise<ChatResponseDto> {
    // Find existing chat by matchId
    const existingChat = await this.getChatByMatchId(matchId);

    if (!existingChat) {
      throw new Error(`No existing chat found for matchId: ${matchId}`);
    }

    // Reactivate the chat if it was archived
    if (existingChat.status === ChatStatus.ARCHIVED) {
      existingChat.status = ChatStatus.ACTIVE;
      await existingChat.save();
    }

    // Create the re-match message
    const message = new this.messageModel({
      chat: existingChat._id,
      senderId,
      senderProfileId,
      text: rematchMessage,
      type: MessageType.TEXT,
      status: MessageStatus.SENT,
      reactions: [],
      isDeleted: false,
    });

    await message.save();

    // Update chat with last message and reset unread counts
    existingChat.lastMessageId = message._id.toString();
    existingChat.lastMessageAt = new Date();

    // Reset unread counts - sender gets 0, others get 1
    const participants = existingChat.participantIds;
    const unreadCount = new Map();
    participants.forEach((participantId) => {
      unreadCount.set(participantId, participantId === senderId ? 0 : 1);
    });
    existingChat.unreadCount = unreadCount;

    await existingChat.save();

    return this.mapChatToResponseDto(existingChat);
  }

  // Reaction methods
  async addReaction(
    addReactionDto: AddReactionDto,
    userId: string,
    userProfileId: string,
    isPremium: boolean = false,
    isTrueFynd: boolean = false,
  ): Promise<ReactionResponseDto> {
    // Check if user has permission to react
    const message = await this.messageModel.findById(addReactionDto.messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Get chat to check permissions
    const chat = await this.chatModel.findById(message.chat);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Check subscription limits
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      chat.profileType,
      isPremium,
      isTrueFynd,
    );
    await this.subscriptionLimitsService.checkReactionPermission(limits);

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (r) => r.userId === userId && r.emoji === addReactionDto.emoji,
    );

    if (existingReaction) {
      throw new BadRequestException('You have already reacted with this emoji');
    }

    // Add reaction
    const reaction = {
      emoji: addReactionDto.emoji,
      userId,
      userProfileId,
      createdAt: new Date(),
    };

    await this.messageModel.updateOne(
      { _id: addReactionDto.messageId },
      { $push: { reactions: reaction } },
    );

    return reaction;
  }

  async removeReaction(
    removeReactionDto: RemoveReactionDto,
    userId: string,
  ): Promise<void> {
    const message = await this.messageModel.findById(
      removeReactionDto.messageId,
    );
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Get chat to check permissions
    const chat = await this.chatModel.findById(message.chat);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Remove reaction
    await this.messageModel.updateOne(
      { _id: removeReactionDto.messageId },
      {
        $pull: {
          reactions: {
            userId,
            emoji: removeReactionDto.emoji,
          },
        },
      },
    );
  }

  async replyToMessage(
    replyDto: ReplyToMessageDto,
    userId: string,
    userProfileId: string,
    isPremium: boolean = false,
    isTrueFynd: boolean = false,
  ): Promise<ChatMessageDto> {
    // Check if user has permission to reply
    const originalMessage = await this.messageModel.findById(
      replyDto.messageId,
    );
    if (!originalMessage) {
      throw new NotFoundException('Original message not found');
    }

    // Get chat to check permissions
    const chat = await this.chatModel.findById(originalMessage.chat);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Check subscription limits
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      chat.profileType,
      isPremium,
      isTrueFynd,
    );
    await this.subscriptionLimitsService.checkReplyPermission(limits);
    await this.subscriptionLimitsService.checkMessageLength(
      replyDto.text,
      limits,
    );
    await this.subscriptionLimitsService.checkMessageLimit(
      userId,
      chat.profileType,
      limits,
    );

    // Check media permissions if media is provided
    if (replyDto.mediaType) {
      await this.subscriptionLimitsService.checkMediaPermission(
        replyDto.mediaType,
        limits,
      );
    }

    // Create reply message
    const replyMessage = new this.messageModel({
      chat: originalMessage.chat,
      senderId: userId,
      senderProfileId: userProfileId,
      text: replyDto.text,
      type: replyDto.mediaType
        ? (replyDto.mediaType as MessageType)
        : MessageType.TEXT,
      replyTo: originalMessage._id,
      mediaUrl: replyDto.mediaUrl,
      mediaType: replyDto.mediaType,
      status: MessageStatus.SENT,
    });

    const savedReply = await replyMessage.save();

    // Update chat with last message info
    await this.chatModel.updateOne(
      { _id: originalMessage.chat },
      {
        lastMessageAt: (savedReply as any).createdAt,
        lastMessageId: savedReply._id.toString(),
        $inc: {
          [`unreadCount.${chat.participantIds.find((id) => id !== userId)}`]: 1,
        },
      },
    );

    return this.mapMessageToResponseDto(savedReply);
  }

  async getMessageReactions(messageId: string): Promise<ReactionResponseDto[]> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message.reactions.map((reaction) => ({
      emoji: reaction.emoji,
      userId: reaction.userId,
      userProfileId: reaction.userProfileId,
      createdAt: reaction.createdAt,
    }));
  }

  async getMessageReplies(
    messageId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<MessageListResponseDto> {
    const skip = (page - 1) * limit;

    const replies = await this.messageModel
      .find({
        replyTo: messageId,
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.messageModel.countDocuments({
      replyTo: messageId,
      isDeleted: false,
    });

    const replyResponses = replies.map((reply) =>
      this.mapMessageToResponseDto(reply),
    );

    return {
      messages: replyResponses.reverse(), // Reverse to get chronological order
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }
}
