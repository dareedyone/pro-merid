import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Anchor } from 'src/feature/anchor/entities/anchor.entity';
import { User } from 'src/feature/user/entities/user/user.entity';
import { Match } from 'src/common/entities/match.entity';
import { Chat } from 'src/feature/chat/entities/chat.entity';
import {
  FacilitateMatchDto,
  ModerateChatDto,
  AssignCounselorDto,
  ModerationReportDto,
  ModerationActionDto,
  ModerationResponseDto,
  ModerationListResponseDto,
  ChatModerationContextDto,
  MatchModerationContextDto,
} from '../dtos/anchor-moderation.dto';
import { AnchorMatchContext, AnchorChatContext } from '../types/anchor.types';
import { ModerationLevel, AnchorRole } from '../types/anchor.enum';
import { EntityRepository } from '@mikro-orm/postgresql';
import { ProfileType } from 'src/common/types/enums/other.enum';

@Injectable()
export class AnchorModerationService {
  private readonly logger = new Logger(AnchorModerationService.name);

  constructor(
    @InjectRepository(Anchor)
    private readonly anchorRepo: EntityRepository<Anchor>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    @InjectRepository(Match)
    private readonly matchRepo: EntityRepository<Match>,
    @InjectRepository(Chat)
    private readonly chatRepo: EntityRepository<Chat>,
    private readonly em: EntityManager,
  ) {}

  async facilitateMatch(
    anchorId: string,
    dto: FacilitateMatchDto,
    counselorId: string,
  ): Promise<MatchModerationContextDto> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      // Validate counselor access
      const hasAccess = await this.validateCounselorAccess(
        counselorId,
        anchorId,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'Insufficient permissions to facilitate matches',
        );
      }

      // Check if users belong to this anchor
      const sourceUser = await this.userRepo.findOne({
        id: dto.sourceUserId,
        anchor: { id: anchorId },
      });
      const targetUser = await this.userRepo.findOne({
        id: dto.targetUserId,
        anchor: { id: anchorId },
      });

      if (!sourceUser || !targetUser) {
        throw new BadRequestException(
          'One or both users do not belong to this anchor',
        );
      }

      let match = await this.matchRepo.findOne({
        $or: [
          { sourceUserId: dto.sourceUserId, targetUserId: dto.targetUserId },
          { sourceUserId: dto.targetUserId, targetUserId: dto.sourceUserId },
        ],
        profileType: ProfileType.DATE,
      });

      if (!match) {
        match = this.matchRepo.create({
          sourceUserId: dto.sourceUserId,
          targetUserId: dto.targetUserId,
          profileType: ProfileType.DATE,
          isFacilitated: true,
          counselorId,
          requiresApproval: dto.requiresApproval || false,
          facilitatedAt: new Date(),
          status: dto.requiresApproval ? 'pending' : 'active',
        });
      } else {
        match.isFacilitated = true;
        match.counselorId = counselorId;
        match.requiresApproval = dto.requiresApproval || false;
        match.facilitatedAt = new Date();
        match.status = dto.requiresApproval ? 'pending' : 'active';
      }

      await this.em.persistAndFlush(match);

      this.logger.log(
        `Facilitated match ${match.id} by counselor ${counselorId}`,
      );

      return this.mapMatchToModerationContext(match, anchor.config);
    } catch (error) {
      this.logger.error(
        `Error facilitating match for anchor ${anchorId}:`,
        error,
      );
      throw error;
    }
  }

  async approveMatch(
    anchorId: string,
    matchId: string,
    counselorId: string,
  ): Promise<void> {
    try {
      const match = await this.matchRepo.findOne({
        id: matchId,
        counselorId,
        isFacilitated: true,
        requiresApproval: true,
      });

      if (!match) {
        throw new NotFoundException('Match not found or not pending approval');
      }

      match.status = 'approved';
      match.approvedAt = new Date();
      match.approvedBy = counselorId;

      await this.em.persistAndFlush(match);

      this.logger.log(`Approved match ${matchId} by counselor ${counselorId}`);
    } catch (error) {
      this.logger.error(`Error approving match ${matchId}:`, error);
      throw error;
    }
  }

  async rejectMatch(
    anchorId: string,
    matchId: string,
    counselorId: string,
    reason?: string,
  ): Promise<void> {
    try {
      const match = await this.matchRepo.findOne({
        id: matchId,
        counselorId,
        isFacilitated: true,
        requiresApproval: true,
      });

      if (!match) {
        throw new NotFoundException('Match not found or not pending approval');
      }

      match.status = 'rejected';
      match.rejectedAt = new Date();
      match.rejectedBy = counselorId;
      match.rejectionReason = reason;

      await this.em.persistAndFlush(match);

      this.logger.log(`Rejected match ${matchId} by counselor ${counselorId}`);
    } catch (error) {
      this.logger.error(`Error rejecting match ${matchId}:`, error);
      throw error;
    }
  }

  async moderateChat(
    anchorId: string,
    dto: ModerateChatDto,
    counselorId: string,
  ): Promise<ChatModerationContextDto> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      // Validate counselor access
      const hasAccess = await this.validateCounselorAccess(
        counselorId,
        anchorId,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'Insufficient permissions to moderate chats',
        );
      }

      const chat = await this.chatRepo.findOne({ id: dto.chatId });
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      // Apply moderation action
      await this.applyChatModeration(chat, dto.action, dto.reason, counselorId);

      this.logger.log(
        `Moderated chat ${dto.chatId} by counselor ${counselorId}`,
      );

      return this.mapChatToModerationContext(chat, anchor.config);
    } catch (error) {
      this.logger.error(`Error moderating chat for anchor ${anchorId}:`, error);
      throw error;
    }
  }

  async assignCounselor(
    anchorId: string,
    dto: AssignCounselorDto,
    adminId: string,
  ): Promise<void> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      // Validate admin access
      const hasAccess = await this.validateCounselorAccess(
        adminId,
        anchorId,
        AnchorRole.ADMIN,
      );
      if (!hasAccess) {
        throw new ForbiddenException(
          'Insufficient permissions to assign counselors',
        );
      }

      const chat = await this.chatRepo.findOne({ id: dto.chatId });
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      const counselor = await this.userRepo.findOne({
        id: dto.counselorId,
        anchor: { id: anchorId },
      });
      if (!counselor) {
        throw new NotFoundException('Counselor not found in this anchor');
      }

      chat.assignedCounselor = counselor;
      chat.counselorAssignedAt = new Date();
      chat.counselorNote = dto.note;

      await this.em.persistAndFlush(chat);

      this.logger.log(
        `Assigned counselor ${dto.counselorId} to chat ${dto.chatId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error assigning counselor for anchor ${anchorId}:`,
        error,
      );
      throw error;
    }
  }

  async getModerationActions(
    anchorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ModerationListResponseDto> {
    try {
      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      // This would require a moderation actions table in a real implementation
      // For now, return empty list
      return {
        actions: [],
        total: 0,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching moderation actions for anchor ${anchorId}:`,
        error,
      );
      throw error;
    }
  }

  async getChatModerationContext(
    anchorId: string,
    chatId: string,
  ): Promise<ChatModerationContextDto> {
    try {
      const chat = await this.chatRepo.findOne({ id: chatId });
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }

      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      return this.mapChatToModerationContext(chat, anchor.config);
    } catch (error) {
      this.logger.error(
        `Error getting chat moderation context ${chatId}:`,
        error,
      );
      throw error;
    }
  }

  async getMatchModerationContext(
    anchorId: string,
    matchId: string,
  ): Promise<MatchModerationContextDto> {
    try {
      const match = await this.matchRepo.findOne({ id: matchId });
      if (!match) {
        throw new NotFoundException('Match not found');
      }

      const anchor = await this.anchorRepo.findOne({ id: anchorId });
      if (!anchor) {
        throw new NotFoundException('Anchor not found');
      }

      return this.mapMatchToModerationContext(match, anchor.config);
    } catch (error) {
      this.logger.error(
        `Error getting match moderation context ${matchId}:`,
        error,
      );
      throw error;
    }
  }

  private async validateCounselorAccess(
    counselorId: string,
    anchorId: string,
    requiredRole: AnchorRole = AnchorRole.COUNSELOR,
  ): Promise<boolean> {
    try {
      const user = await this.userRepo.findOne({
        id: counselorId,
        anchor: { id: anchorId },
      });

      if (!user) {
        return false;
      }

      // Check role hierarchy
      const roleHierarchy = {
        [AnchorRole.OWNER]: 4,
        [AnchorRole.ADMIN]: 3,
        [AnchorRole.MODERATOR]: 2,
        [AnchorRole.COUNSELOR]: 1,
      };

      const userRoleLevel = roleHierarchy[user.anchorRole as AnchorRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      return userRoleLevel >= requiredRoleLevel;
    } catch (error) {
      this.logger.error(
        `Error validating counselor access ${counselorId}:`,
        error,
      );
      return false;
    }
  }

  private async applyChatModeration(
    chat: any,
    action: ModerationLevel,
    reason?: string,
    counselorId?: string,
  ): Promise<void> {
    // Apply moderation action based on level
    switch (action) {
      case ModerationLevel.BASIC:
        chat.isModerated = true;
        chat.moderationLevel = 'basic';
        break;
      case ModerationLevel.ADVANCED:
        chat.isModerated = true;
        chat.moderationLevel = 'advanced';
        chat.requiresReview = true;
        break;
      case ModerationLevel.FULL:
        chat.isModerated = true;
        chat.moderationLevel = 'full';
        chat.isSuspended = true;
        break;
      default:
        // No moderation
        break;
    }

    if (reason) {
      chat.moderationReason = reason;
    }
    if (counselorId) {
      chat.moderatedBy = counselorId;
      chat.moderatedAt = new Date();
    }

    await this.em.persistAndFlush(chat);
  }

  private mapChatToModerationContext(
    chat: any,
    config: any,
  ): ChatModerationContextDto {
    return {
      chatId: chat.id,
      isMonitored: chat.isModerated || false,
      counselorId: chat.assignedCounselor?.id,
      canModerate: true, // This would be determined by user permissions
      moderationLevel: config.moderation?.level || 'none',
      lastModeratedAt: chat.moderatedAt,
      moderationCount: chat.moderationCount || 0,
    };
  }

  private mapMatchToModerationContext(
    match: any,
    config: any,
  ): MatchModerationContextDto {
    return {
      matchId: match.id,
      isFacilitated: match.isFacilitated || false,
      counselorId: match.counselorId,
      requiresApproval: match.requiresApproval || false,
      moderationLevel: config.moderation?.level || 'none',
      facilitatedAt: match.facilitatedAt,
      approvedAt: match.approvedAt,
      status: match.status || 'pending',
    };
  }
}
