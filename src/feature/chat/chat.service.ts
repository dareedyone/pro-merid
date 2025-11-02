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
import { Call, CallDocument, CallStatus } from './entities/call.entity';
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
import {
  InitiateCallDto,
  AnswerCallDto,
  EndCallDto,
  CallResponseDto,
  CallHistoryDto,
  CallListResponseDto,
} from './dto/call.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionLimitsService } from './subscription-limits.service';
import { CallProviderFactory } from './services/call-provider.factory';
import { ICallProvider } from './interfaces/call-provider.interface';
import {
  NotificationService,
  NotificationType,
} from '../../system/notification/notification.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Call.name) private callModel: Model<CallDocument>,
    private readonly subscriptionLimitsService: SubscriptionLimitsService,
    private readonly callProviderFactory: CallProviderFactory,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
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

  // ==================== CALL METHODS ====================

  /**
   * Initiate a call in a chat
   */
  async initiateCall(
    initiateCallDto: InitiateCallDto,
    authId: string, // Auth ID for Agora UID generation
    callerProfileId: string,
    isPremium: boolean = false,
    isTrueFynd: boolean = false,
  ): Promise<CallResponseDto> {
    const { chatId, type } = initiateCallDto;

    // Get user ID from auth ID for database queries
    const { user } = await this.authService.fetchAuthUser(authId);
    const callerId = user.id; // User UUID for database queries

    // Verify chat exists and user has access
    const chat = await this.chatModel.findOne({
      _id: chatId,
      participantIds: { $in: [callerId] },
      status: ChatStatus.ACTIVE,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Check if user is already in a call
    const existingCall = await this.callModel.findOne({
      participantIds: { $in: [callerId] },
      status: {
        $in: [CallStatus.INITIATING, CallStatus.RINGING, CallStatus.CONNECTED],
      },
    });

    if (existingCall) {
      throw new BadRequestException('User is already in a call');
    }

    // Check subscription limits for calling
    this.subscriptionLimitsService.getSubscriptionLimits(
      chat.profileType,
      isPremium,
      isTrueFynd,
    );

    // For now, we'll allow all users to make calls
    // In the future, you can add call-specific limits here

    // Get call provider and generate channel/token
    const callProvider = this.callProviderFactory.getProvider();
    const providerType = callProvider.getProviderType();
    const channelName = callProvider.generateChannelName(chatId);
    const tokenResponse = await callProvider.generateToken(
      channelName,
      authId, // Use authId for provider UID generation
    );

    // Get caller name
    const callerName =
      user.displayName || `${user.firstName} ${user.lastName}`.trim();

    // Create call record
    const call = new this.callModel({
      chatId,
      callerId,
      callerProfileId,
      participantIds: chat.participantIds,
      participantProfileIds: chat.profileIds,
      type,
      status: CallStatus.INITIATING,
      provider: providerType,
      channelName,
      token: tokenResponse.token,
      callerUid: tokenResponse.uid,
      participantUids: new Map([[callerId, tokenResponse.uid]]),
    });

    const savedCall = await call.save();

    // Send notification to other participants
    const otherParticipants = chat.participantIds.filter(
      (id) => id !== callerId,
    );
    for (const participantId of otherParticipants) {
      await this.notificationService.sendNotification({
        userId: participantId,
        type: NotificationType.CALL_INCOMING,
        data: {
          callId: savedCall._id.toString(),
          chatId,
          callType: type,
          callerName,
          callerAvatar: chat.avatar,
        },
      });
    }

    return this.mapCallToResponseDto(savedCall);
  }

  /**
   * Answer an incoming call
   */
  async answerCall(
    answerCallDto: AnswerCallDto,
    authId: string,
    userId: string,
    _userProfileId: string,
  ): Promise<CallResponseDto> {
    const { callId, accept = true } = answerCallDto;

    const call = await this.callModel.findOne({
      _id: callId,
      participantIds: { $in: [userId] },
      status: { $in: [CallStatus.INITIATING, CallStatus.RINGING] },
    });

    if (!call) {
      throw new NotFoundException('Call not found or already ended');
    }

    if (!accept) {
      // Decline the call
      call.status = CallStatus.DECLINED;
      call.endReason = 'declined';
      call.endedAt = new Date();
      await call.save();

      // Notify caller
      await this.notificationService.sendNotification({
        userId: call.callerId,
        type: NotificationType.CALL_DECLINED,
        data: {
          callId: call._id.toString(),
          chatId: call.chatId,
        },
      });

      return this.mapCallToResponseDto(call);
    }

    // Accept the call
    call.status = CallStatus.CONNECTED;
    call.startedAt = new Date();

    // Generate token for the answering user
    const callProvider = this.callProviderFactory.getProvider();
    const channelName: string = call.channelName;
    const tokenResponse = await callProvider.generateToken(
      channelName,
      authId, // Use authId for provider UID generation
    );

    // Add user to participant UIDs
    call.participantUids.set(userId, tokenResponse.uid);
    // Note: Token is per-user, so we don't update the call token

    await call.save();

    // Notify all participants that call is connected
    for (const participantId of call.participantIds) {
      await this.notificationService.sendNotification({
        userId: participantId,
        type: NotificationType.CALL_ENDED, // Using CALL_ENDED to indicate call started
        data: {
          callId: call._id.toString(),
          chatId: call.chatId,
          callType: call.type,
        },
      });
    }

    return this.mapCallToResponseDto(call);
  }

  /**
   * End a call
   */
  async endCall(endCallDto: EndCallDto, userId: string): Promise<void> {
    const { callId, reason = 'hung_up' } = endCallDto;

    const call = await this.callModel.findOne({
      _id: callId,
      participantIds: { $in: [userId] },
      status: { $in: [CallStatus.CONNECTED, CallStatus.RINGING] },
    });

    if (!call) {
      throw new NotFoundException('Call not found or already ended');
    }

    // Calculate duration
    const now = new Date();
    const duration = call.startedAt
      ? Math.floor((now.getTime() - call.startedAt.getTime()) / 1000)
      : 0;

    // Update call status
    call.status = CallStatus.ENDED;
    call.endedAt = now;
    call.duration = duration;
    call.endReason = reason;

    await call.save();

    // Notify all participants that call ended
    for (const participantId of call.participantIds) {
      if (participantId !== userId) {
        await this.notificationService.sendNotification({
          userId: participantId,
          type: NotificationType.CALL_ENDED,
          data: {
            callId: call._id.toString(),
            chatId: call.chatId,
            callType: call.type,
            duration,
          },
        });
      }
    }
  }

  /**
   * Get call history for a user
   */
  async getCallHistory(
    userId: string,
    _profileType: ProfileType = ProfileType.DATE,
    page: number = 1,
    limit: number = 20,
  ): Promise<CallListResponseDto> {
    const skip = (page - 1) * limit;

    // Get calls where user participated
    const calls = await this.callModel
      .find({
        participantIds: { $in: [userId] },
        status: CallStatus.ENDED,
      })
      .populate('chatId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.callModel.countDocuments({
      participantIds: { $in: [userId] },
      status: CallStatus.ENDED,
    });

    const callHistory = calls.map((call) => this.mapCallToHistoryDto(call));

    return {
      calls: callHistory,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Get active call for a user
   */
  async getActiveCall(userId: string): Promise<CallResponseDto | null> {
    const call = await this.callModel.findOne({
      participantIds: { $in: [userId] },
      status: {
        $in: [CallStatus.INITIATING, CallStatus.RINGING, CallStatus.CONNECTED],
      },
    });

    return call ? this.mapCallToResponseDto(call) : null;
  }

  /**
   * Get call provider configuration
   */
  getCallProviderConfig(): any {
    const provider = this.callProviderFactory.getProvider();
    return provider.getProviderConfig();
  }

  /**
   * Get available call providers
   */
  getAvailableCallProviders(): Record<
    string,
    { available: boolean; configured: boolean }
  > {
    return this.callProviderFactory.getAvailableProviders();
  }

  // ==================== HELPER METHODS ====================

  private mapCallToResponseDto(call: CallDocument): CallResponseDto {
    return {
      id: call._id.toString(),
      chatId: call.chatId,
      callerId: call.callerId,
      callerProfileId: call.callerProfileId,
      participantIds: call.participantIds,
      participantProfileIds: call.participantProfileIds,
      type: call.type,
      status: call.status,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      duration: call.duration,
      endReason: call.endReason,
      provider: call.provider,
      channelName: call.channelName,
      token: call.token,
      callerUid: call.callerUid,
      participantUids: Object.fromEntries(call.participantUids),
      isRecording: call.isRecording,
      recordingUrl: call.recordingUrl,
      createdAt:
        'createdAt' in call && call.createdAt instanceof Date
          ? call.createdAt
          : new Date(),
      updatedAt:
        'updatedAt' in call && call.updatedAt instanceof Date
          ? call.updatedAt
          : new Date(),
    };
  }

  private mapCallToHistoryDto(call: CallDocument): CallHistoryDto {
    const populatedChat = call.populated('chatId');
    const chat =
      populatedChat &&
      typeof populatedChat === 'object' &&
      'name' in populatedChat
        ? (populatedChat as { name: string; avatar?: string })
        : null;

    // Get createdAt properly typed from Mongoose timestamps
    const createdAtValue = 'createdAt' in call && call.createdAt;
    const createdAt =
      createdAtValue instanceof Date ? createdAtValue : new Date();

    return {
      id: call._id.toString(),
      chatId: call.chatId,
      chatName: chat?.name || 'Unknown Chat',
      chatAvatar: chat?.avatar,
      callerId: call.callerId,
      callerName: 'Caller', // TODO: Get actual caller name from user service
      callerAvatar: chat?.avatar,
      type: call.type,
      status: call.status,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      duration: call.duration,
      endReason: call.endReason,
      isRecording: call.isRecording,
      recordingUrl: call.recordingUrl,
      createdAt: createdAt instanceof Date ? createdAt : new Date(),
    };
  }
}
