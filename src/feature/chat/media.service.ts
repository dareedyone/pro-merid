import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument, ChatStatus } from './entities/chat.entity';
import { Message, MessageDocument, MessageType, MessageStatus } from './entities/message.entity';
import { UploadMediaDto, MediaUploadResponseDto, MediaMessageDto } from './dto/media.dto';
import { SubscriptionLimitsService } from './subscription-limits.service';
import { ProfileType } from 'src/common/types/enums/other.enum';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly subscriptionLimitsService: SubscriptionLimitsService,
  ) {}

  async uploadMedia(
    uploadDto: UploadMediaDto,
    file: Express.Multer.File,
    userId: string,
    userProfileId: string,
    isPremium: boolean = false,
    isTrueFynd: boolean = false,
  ): Promise<MediaUploadResponseDto> {
    // Verify chat exists and user is participant
    const chat = await this.chatModel.findOne({
      _id: uploadDto.chatId,
      participantIds: userId,
      status: ChatStatus.ACTIVE,
    });

    if (!chat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Check subscription limits
    const limits = this.subscriptionLimitsService.getSubscriptionLimits(
      chat.profileType,
      isPremium,
      isTrueFynd,
    );

    // Check media permissions
    await this.subscriptionLimitsService.checkMediaPermission(uploadDto.type, limits);

    // Validate file type and size
    this.validateMediaFile(file, uploadDto.type, limits);

    // Generate unique filename
    const filename = this.generateFilename(file.originalname, userId);
    
    // Upload file to storage (this would integrate with AWS S3, Google Cloud, etc.)
    const mediaUrl = await this.uploadToStorage(file, filename);
    
    // Generate thumbnail for images and videos
    const thumbnailUrl = await this.generateThumbnail(file, filename, uploadDto.type);

    // Create message with media
    const message = new this.messageModel({
      chat: uploadDto.chatId,
      senderId: userId,
      senderProfileId: userProfileId,
      text: uploadDto.caption || '',
      type: uploadDto.type,
      mediaUrl,
      mediaType: file.mimetype,
      mediaSize: file.size,
      thumbnailUrl,
      replyTo: uploadDto.replyTo,
      status: MessageStatus.SENT,
    });

    const savedMessage = await message.save();

    // Update chat with last message info
    await this.chatModel.updateOne(
      { _id: uploadDto.chatId },
      {
        lastMessageAt: (savedMessage as any).createdAt,
        lastMessageId: savedMessage._id.toString(),
        $inc: {
          [`unreadCount.${chat.participantIds.find(id => id !== userId)}`]: 1,
        },
      },
    );

    return {
      messageId: savedMessage._id.toString(),
      mediaUrl,
      thumbnailUrl,
      mediaType: file.mimetype,
      mediaSize: file.size,
      caption: uploadDto.caption,
      uploadedAt: (savedMessage as any).createdAt,
    };
  }

  async getMediaMessage(messageId: string, userId: string): Promise<MediaMessageDto> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user has access to this message
    const chat = await this.chatModel.findById(message.chat);
    if (!chat || !chat.participantIds.includes(userId)) {
      throw new NotFoundException('Access denied');
    }

    return this.mapMessageToMediaDto(message);
  }

  async deleteMediaMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    // Soft delete the message
    await this.messageModel.updateOne(
      { _id: messageId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      },
    );

    // TODO: Optionally delete the actual media files from storage
  }

  private validateMediaFile(file: Express.Multer.File, type: MessageType, limits: any): void {
    const maxSizes: Record<string, number> = {
      [MessageType.IMAGE]: 10 * 1024 * 1024, // 10MB
      [MessageType.VIDEO]: 100 * 1024 * 1024, // 100MB
      [MessageType.AUDIO]: 50 * 1024 * 1024, // 50MB
      [MessageType.FILE]: 25 * 1024 * 1024, // 25MB
    };

    const allowedTypes: Record<string, string[]> = {
      [MessageType.IMAGE]: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      [MessageType.VIDEO]: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      [MessageType.AUDIO]: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
      [MessageType.FILE]: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    const typeKey = type as string;
    if (!allowedTypes[typeKey]?.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type for ${type}. Allowed types: ${allowedTypes[typeKey]?.join(', ')}`);
    }

    if (file.size > (maxSizes[typeKey] || 0)) {
      throw new BadRequestException(`File too large for ${type}. Maximum size: ${(maxSizes[typeKey] || 0) / (1024 * 1024)}MB`);
    }
  }

  private generateFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
  }

  private async uploadToStorage(file: Express.Multer.File, filename: string): Promise<string> {
    // TODO: Implement actual file upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // For now, return a placeholder URL
    return `https://storage.example.com/media/${filename}`;
  }

  private async generateThumbnail(
    file: Express.Multer.File,
    filename: string,
    type: MessageType,
  ): Promise<string | undefined> {
    // TODO: Implement thumbnail generation for images and videos
    // For now, return undefined
    if (type === MessageType.IMAGE || type === MessageType.VIDEO) {
      return `https://storage.example.com/thumbnails/${filename}`;
    }
    return undefined;
  }

  private mapMessageToMediaDto(message: MessageDocument): MediaMessageDto {
    return {
      id: message._id.toString(),
      senderId: message.senderId,
      senderProfileId: message.senderProfileId,
      text: message.text,
      type: message.type,
      mediaUrl: message.mediaUrl || '',
      mediaType: message.mediaType || '',
      mediaSize: message.mediaSize || 0,
      thumbnailUrl: message.thumbnailUrl,
      replyTo: message.replyTo?.toString(),
      reactions: message.reactions.map(reaction => ({
        emoji: reaction.emoji,
        userId: reaction.userId,
        userProfileId: reaction.userProfileId,
      })),
      isDeleted: message.isDeleted,
      createdAt: (message as any).createdAt,
      updatedAt: (message as any).updatedAt,
    };
  }
}
