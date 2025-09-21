import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './entities/chat.entity';
import { Message, MessageDocument } from './entities/message.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';

export const UNLIMITED = Number.MAX_SAFE_INTEGER;

export const isUnlimited = (limit: number): boolean => limit === UNLIMITED;

export interface SubscriptionLimits {
  maxActiveChats: number;
  maxMessagesPerDay: number;
  maxMessageLength: number;
  canSendMedia: boolean;
  canSendLocation: boolean;
  canReact: boolean;
  canReply: boolean;
  maxMediaPerDay: number;
  maxMediaSizeMB: number;
  canSendHighResMedia: boolean;
  canSendFiles: boolean;
  hasReadReceipts: boolean;
}

@Injectable()
export class SubscriptionLimitsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  getSubscriptionLimits(
    profileType: ProfileType,
    isPremium: boolean,
    isTrueFynd: boolean,
  ): SubscriptionLimits {
    const defaultLimits = {
      maxActiveChats: 3,
      maxMessagesPerDay: UNLIMITED,
      maxMessageLength: UNLIMITED,
      canSendMedia: true,
      canSendLocation: true,
      canReact: true,
      canReply: true,
    };

    const defaultPremiumLimits = {
      ...defaultLimits,
      maxMediaPerDay: UNLIMITED,
      maxMediaSizeMB: 100,
      canSendHighResMedia: true,
      canSendFiles: true,
      hasReadReceipts: true,
    };

    if (isPremium) {
      return defaultPremiumLimits;
    } else if (isTrueFynd) {
      return {
        ...defaultPremiumLimits,
      };
    } else {
      return {
        ...defaultLimits,
        maxMediaPerDay: 10,
        maxMediaSizeMB: 5,
        canSendHighResMedia: false,
        canSendFiles: false,
        hasReadReceipts: false,
      };
    }
  }

  async checkChatLimit(
    userId: string,
    profileType: ProfileType,
    limits: SubscriptionLimits,
  ): Promise<void> {
    const activeChatCount = await this.chatModel.countDocuments({
      participantIds: userId,
      profileType,
      status: { $ne: 'deleted' },
    });

    if (activeChatCount >= limits.maxActiveChats) {
      throw new BadRequestException(
        `You have reached the maximum number of active chats (${limits.maxActiveChats}). Upgrade your subscription to chat with more people.`,
      );
    }
  }

  async checkMessageLimit(
    userId: string,
    profileType: ProfileType,
    limits: SubscriptionLimits,
  ): Promise<void> {
    if (isUnlimited(limits.maxMessagesPerDay)) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messagesToday = await this.messageModel.countDocuments({
      senderId: userId,
      createdAt: { $gte: today },
    });

    if (messagesToday >= limits.maxMessagesPerDay) {
      throw new BadRequestException(
        `You have reached your daily message limit (${limits.maxMessagesPerDay}). Upgrade your subscription to send more messages.`,
      );
    }
  }

  async checkMessageLength(
    text: string,
    limits: SubscriptionLimits,
  ): Promise<void> {
    if (isUnlimited(limits.maxMessageLength)) {
      return;
    }

    if (text.length > limits.maxMessageLength) {
      throw new BadRequestException(
        `Message too long. Maximum length is ${limits.maxMessageLength} characters.`,
      );
    }
  }

  async checkMediaPermission(
    messageType: string,
    limits: SubscriptionLimits,
  ): Promise<void> {
    const mediaTypes = ['image', 'video', 'audio', 'file'];

    if (mediaTypes.includes(messageType) && !limits.canSendMedia) {
      throw new BadRequestException(
        'Media messages are not available in your current plan. Upgrade to Premium or TrueFynd to send media.',
      );
    }
  }

  async checkLocationPermission(
    messageType: string,
    limits: SubscriptionLimits,
  ): Promise<void> {
    if (messageType === 'location' && !limits.canSendLocation) {
      throw new BadRequestException(
        'Location sharing is not available in your current plan. Upgrade to Premium or TrueFynd to share your location.',
      );
    }
  }

  async checkReactionPermission(limits: SubscriptionLimits): Promise<void> {
    if (!limits.canReact) {
      throw new BadRequestException(
        'Reactions are not available in your current plan. Upgrade to Premium or TrueFynd to react to messages.',
      );
    }
  }

  async checkReplyPermission(limits: SubscriptionLimits): Promise<void> {
    if (!limits.canReply) {
      throw new BadRequestException(
        'Reply functionality is not available in your current plan. Upgrade to Premium or TrueFynd to reply to messages.',
      );
    }
  }

  async checkMediaDailyLimit(
    userId: string,
    limits: SubscriptionLimits,
  ): Promise<void> {
    if (isUnlimited(limits.maxMediaPerDay)) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mediaToday = await this.messageModel.countDocuments({
      senderId: userId,
      type: { $in: ['image', 'video', 'audio', 'file'] },
      createdAt: { $gte: today },
    });

    if (mediaToday >= limits.maxMediaPerDay) {
      throw new BadRequestException(
        `You have reached your daily media limit (${limits.maxMediaPerDay}). Upgrade to send more media files.`,
      );
    }
  }

  async checkMediaSize(
    fileSizeMB: number,
    limits: SubscriptionLimits,
  ): Promise<void> {
    if (fileSizeMB > limits.maxMediaSizeMB) {
      throw new BadRequestException(
        `File too large. Maximum size is ${limits.maxMediaSizeMB}MB. ${
          !limits.canSendHighResMedia
            ? 'Upgrade to Premium for larger files.'
            : ''
        }`,
      );
    }
  }

  async checkHighResMediaPermission(
    isHighRes: boolean,
    limits: SubscriptionLimits,
  ): Promise<void> {
    if (isHighRes && !limits.canSendHighResMedia) {
      throw new BadRequestException(
        'High resolution media is not available in your current plan. Upgrade to Premium for HD photos and videos.',
      );
    }
  }

  async checkFilePermission(
    messageType: string,
    limits: SubscriptionLimits,
  ): Promise<void> {
    const fileTypes = ['file', 'document', 'pdf'];

    if (fileTypes.includes(messageType) && !limits.canSendFiles) {
      throw new BadRequestException(
        'File sharing is not available in your current plan. Upgrade to Premium to send documents and files.',
      );
    }
  }

  async getUsageStats(
    userId: string,
    profileType: ProfileType,
  ): Promise<{
    activeChats: number;
    messagesToday: number;
    messagesThisWeek: number;
    messagesThisMonth: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [activeChats, messagesToday, messagesThisWeek, messagesThisMonth] =
      await Promise.all([
        this.chatModel.countDocuments({
          participantIds: userId,
          profileType,
          status: { $ne: 'deleted' },
        }),
        this.messageModel.countDocuments({
          senderId: userId,
          createdAt: { $gte: today },
        }),
        this.messageModel.countDocuments({
          senderId: userId,
          createdAt: { $gte: weekAgo },
        }),
        this.messageModel.countDocuments({
          senderId: userId,
          createdAt: { $gte: monthAgo },
        }),
      ]);

    return {
      activeChats,
      messagesToday,
      messagesThisWeek,
      messagesThisMonth,
    };
  }

  async getUpgradeRecommendation(
    userId: string,
    profileType: ProfileType,
    currentLimits: SubscriptionLimits,
  ): Promise<{
    shouldUpgrade: boolean;
    reason: string;
    recommendedPlan: string;
  }> {
    const usage = await this.getUsageStats(userId, profileType);
    const limits = currentLimits;

    // Check if user is at chat limit (main restriction)
    const chatUsagePercent = (usage.activeChats / limits.maxActiveChats) * 100;

    if (chatUsagePercent >= 80) {
      return {
        shouldUpgrade: true,
        reason: `You're using ${usage.activeChats}/${limits.maxActiveChats} active chats. Focus on meaningful connections!`,
        recommendedPlan: 'Premium', // For media features
      };
    }

    // Main upgrade drivers: enhanced media capabilities
    if (!limits.canSendFiles && usage.messagesToday > 5) {
      return {
        shouldUpgrade: true,
        reason: 'Upgrade to send documents, files, and high-resolution media',
        recommendedPlan: 'Premium',
      };
    }

    if (!limits.hasReadReceipts && usage.activeChats >= 2) {
      return {
        shouldUpgrade: true,
        reason: 'Get read receipts to know when your messages are seen',
        recommendedPlan: 'Premium',
      };
    }

    // TrueFynd upgrade for advanced features
    if (
      limits.canSendFiles &&
      limits.hasReadReceipts &&
      usage.activeChats >= 2
    ) {
      return {
        shouldUpgrade: true,
        reason:
          'Get TrueFynd for unlimited media, advanced matching, and priority support',
        recommendedPlan: 'TrueFynd',
      };
    }

    return {
      shouldUpgrade: false,
      reason:
        'You have access to all core features. Focus on building great connections!',
      recommendedPlan: 'Current',
    };
  }
}
