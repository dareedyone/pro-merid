import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AuthService } from '../../feature/auth/auth.service';
import { User } from '../../feature/user/entities/user/user.entity';
import { ProfileInteraction } from '../../feature/user/entities/profile/profile-interaction.entity';
import { Match } from '../entities/match.entity';
import {
  InteractionType,
  ProfileType,
  InteractionEventType,
  RematchStatus,
} from '../types/enums/other.enum';
import { ChatService } from '../../feature/chat/chat.service';
import {
  NotificationService,
  NotificationType,
} from '../../system/notification/notification.service';
import {
  CreateInteractionDto,
  UnmatchDto,
  InteractionResponseDto,
  MatchResponseDto,
  RematchRequestDto,
  RematchResponseDto,
} from '../dtos/interaction.dto';
import { AuthenticatedUser } from '../types/request.types';

export interface MatchEventPayload {
  event: InteractionEventType;
  initiatedBy: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class InteractionService {
  private readonly logger = new Logger(InteractionService.name);

  constructor(
    @InjectRepository(ProfileInteraction)
    private readonly profileInteractionRepo: EntityRepository<ProfileInteraction>,
    @InjectRepository(Match)
    private readonly matchRepo: EntityRepository<Match>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  private addMatchEvent(match: Match, payload: MatchEventPayload) {
    if (!match.matchEvents) {
      match.matchEvents = [];
    }

    match.matchEvents.push({
      event: payload.event,
      timestamp: new Date(),
      initiatedBy: payload.initiatedBy,
      metadata: payload.metadata,
    });
  }

  async notifyMatchParties({
    sourceUserId,
    targetUserId,
    targetUserName,
    sourceUserName,
  }: {
    sourceUserId: string;
    targetUserId: string;
    targetUserName: string;
    sourceUserName: string;
  }) {
    try {
      await this.notificationService.sendNotification({
        userId: sourceUserId,
        type: NotificationType.MATCH,
        data: {
          matchedUserId: targetUserId,
          matchedUserName: targetUserName,
          chatId: undefined,
        },
      });

      await this.notificationService.sendNotification({
        userId: targetUserId,
        type: NotificationType.MATCH,
        data: {
          matchedUserId: sourceUserId,
          matchedUserName: sourceUserName,
          chatId: undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send match notifications:', error);
    }
  }

  generateMatchId(
    profileId1: string,
    profileId2: string,
    profileType: ProfileType,
  ): string {
    const [firstId, secondId] = [profileId1, profileId2].sort();
    return `${firstId}-${secondId}-${profileType}`;
  }

  async createMatch(
    matchId: string,
    profileType: ProfileType,
    matchedAt: Date,
    sourceUserId: string,
    targetUserId: string,
  ): Promise<Match> {
    let match = await this.matchRepo.findOne({ matchId });

    if (match) {
      throw new BadRequestException('Match already exists');
    }
    match = this.matchRepo.create({
      matchId,
      profileType,
      matchedAt,
      sourceUserId,
      targetUserId,
    });
    await this.em.persistAndFlush(match);

    this.addMatchEvent(match, {
      event: InteractionEventType.INITIAL_MATCH,
      initiatedBy: sourceUserId,
    });
    return match;
  }

  async createInteraction(
    authUser: AuthenticatedUser,
    dto: CreateInteractionDto,
  ): Promise<InteractionResponseDto> {
    const sourceUser = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });
    const targetUser = await this.userRepo.findOneOrFail({
      id: dto.targetUserId,
    });

    const interactionType = dto.type;
    const profileType = dto.profileType;

    return await this.em.transactional(async (em) => {
      try {
        const existingInteraction = await em.findOne(ProfileInteraction, {
          sourceUser,
          targetUser,
          sourceProfileId: dto.sourceProfileId,
          type: interactionType,
          profileType: profileType,
        });

        if (existingInteraction) {
          return this.buildResponse(existingInteraction, profileType);
        }

        const interaction = em.create(ProfileInteraction, {
          type: interactionType,
          profileType: profileType,
          sourceUser,
          targetUser,
          sourceProfileId: dto.sourceProfileId,
          targetProfileId: dto.targetProfileId,
          sourceLocationProfileId: dto.sourceProfileId,
          targetLocationProfileId: dto.targetProfileId,
          interactionDate: new Date(),
          isMatch: false,
        });

        await em.persist(interaction);

        let isMatch = false;
        let matchedAt: Date | undefined;

        const reverseInteraction = await em.findOne(ProfileInteraction, {
          sourceUser: targetUser,
          targetUser: sourceUser,
          targetProfileId: dto.sourceProfileId,
          type: interactionType,
          profileType: profileType,
        });

        if (reverseInteraction) {
          isMatch = true;
          matchedAt = new Date();

          const matchId = this.generateMatchId(
            sourceUser.id,
            targetUser.id,
            profileType,
          );

          const match = await this.createMatch(
            matchId,
            profileType,
            matchedAt,
            sourceUser.id,
            targetUser.id,
          );

          interaction.isMatch = true;
          interaction.matchedAt = matchedAt;
          interaction.match = match;
          reverseInteraction.isMatch = true;
          reverseInteraction.matchedAt = matchedAt;
          reverseInteraction.match = match;

          await em.persist([interaction, reverseInteraction]);
        }
        await em.flush();

        if (isMatch) {
          setImmediate(async () => {
            await this.notifyMatchParties({
              sourceUserId: sourceUser.id,
              targetUserId: targetUser.id,
              targetUserName: targetUser.firstName,
              sourceUserName: sourceUser.firstName,
            });
          });
        }

        return this.buildResponse(interaction, profileType);
      } catch (error: any) {
        if (
          error.code === '23505' ||
          error.message?.includes('duplicate key')
        ) {
          const existingInteraction = await em.findOne(ProfileInteraction, {
            sourceUser,
            targetUser,
            sourceProfileId: dto.sourceProfileId,
            type: interactionType,
            profileType: profileType,
          });

          if (existingInteraction) {
            return this.buildResponse(existingInteraction, profileType);
          }
        }
        throw error;
      }
    });
  }

  async unmatch(
    authUser: AuthenticatedUser,
    dto: UnmatchDto,
  ): Promise<{ message: string }> {
    const sourceUser = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });
    const targetUserId = dto.targetUserId;
    const profileType = dto.profileType;

    const matchId = this.generateMatchId(
      sourceUser.id,
      targetUserId,
      profileType,
    );

    const match = await this.matchRepo.findOneOrFail({
      matchId,
      $or: [{ sourceUserId: sourceUser.id }, { targetUserId: sourceUser.id }],
    });

    const unmatchedAt = new Date();
    match.isUnmatched = true;
    match.unmatchedAt = unmatchedAt;
    match.unmatchedBy = sourceUser.id;
    match.unmatchReason = dto.reason;
    match.unmatchMessage = dto.customMessage;

    this.addMatchEvent(match, {
      event: InteractionEventType.UNMATCH,
      initiatedBy: sourceUser.id,
      metadata: {
        reason: dto.reason,
        customMessage: dto.customMessage,
      },
    });

    await this.em.persistAndFlush(match);

    await this.archiveChatForUnmatch(sourceUser.id, targetUserId, profileType);

    return { message: 'Successfully unmatched' };
  }

  async getInteractionHistory(
    authUser: AuthenticatedUser,
    profileType: ProfileType,
    page: number = 1,
    limit: number = 20,
  ): Promise<InteractionResponseDto[]> {
    const user = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });
    const offset = (page - 1) * limit;

    const interactions = await this.profileInteractionRepo.find(
      {
        sourceUser: user,
        profileType,
      },
      {
        populate: ['targetUser', 'match'],
        orderBy: { createdAt: 'desc' },
        limit,
        offset,
      },
    );

    return interactions.map((interaction) =>
      this.mapInteractionToDto(interaction, profileType),
    );
  }

  async getMatches(
    authUser: AuthenticatedUser,
    profileType: ProfileType,
  ): Promise<MatchResponseDto[]> {
    const user = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });

    const matches = await this.profileInteractionRepo.find(
      {
        sourceUser: user,
        profileType,
        isMatch: true,
      },
      {
        populate: ['targetUser'],
        orderBy: { matchedAt: 'desc' },
      },
    );

    return matches.map((match) => this.mapMatchToDto(match, profileType));
  }

  async getDailyInteractionCount(
    authUser: AuthenticatedUser,
    type: InteractionType,
    profileType: ProfileType,
  ): Promise<number> {
    const user = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.profileInteractionRepo.count({
      sourceUser: user,
      type,
      profileType,
      interactionDate: { $gte: today },
    });
  }

  async hasInteraction(
    userId: string,
    targetUserId: string,
    type: InteractionType,
    profileType: ProfileType,
  ): Promise<boolean> {
    const interaction = await this.profileInteractionRepo.findOne({
      sourceUser: { id: userId },
      targetUser: { id: targetUserId },
      type,
      profileType,
    });

    return !!interaction;
  }

  async getInteractionsBetweenUsers(
    userId1: string,
    userId2: string,
  ): Promise<ProfileInteraction[]> {
    return await this.profileInteractionRepo.find({
      $or: [
        { sourceUser: { id: userId1 }, targetUser: { id: userId2 } },
        { sourceUser: { id: userId2 }, targetUser: { id: userId1 } },
      ],
    });
  }

  async areUsersMatched(
    userId1: string,
    userId2: string,
  ): Promise<{
    isDatingMatch: boolean;
    isFriendMatch: boolean;
    datingMatchDate?: Date;
    friendMatchDate?: Date;
  }> {
    const interactions = await this.getInteractionsBetweenUsers(
      userId1,
      userId2,
    );

    const datingMatch = interactions.find(
      (i) => i.isMatch && i.profileType === ProfileType.DATE,
    );

    const friendMatch = interactions.find(
      (i) => i.isMatch && i.profileType === ProfileType.FRIEND,
    );

    return {
      isDatingMatch: !!datingMatch,
      isFriendMatch: !!friendMatch,
      datingMatchDate: datingMatch?.matchedAt,
      friendMatchDate: friendMatch?.matchedAt,
    };
  }

  async requestRematch(
    authUser: AuthenticatedUser,
    dto: RematchRequestDto,
  ): Promise<{ message: string }> {
    const sourceUser = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });
    const targetUser = await this.userRepo.findOneOrFail({
      id: dto.targetUserId,
    });

    const matchId = this.generateMatchId(
      sourceUser.id,
      targetUser.id,
      dto.profileType,
    );

    const match = await this.matchRepo.findOne({
      matchId,
      isUnmatched: true,
      $or: [{ sourceUserId: sourceUser.id }, { targetUserId: sourceUser.id }],
    });

    if (!match) {
      throw new Error('No unmatched relationship found between these users');
    }

    if (match.rematchContext?.status === RematchStatus.PENDING) {
      throw new Error('A rematch request is already pending');
    }

    if (match.rematchContext?.status === RematchStatus.REJECTED) {
      throw new Error(
        'You cannot request a rematch because the previous rematch was rejected.',
      );
    }

    const rematchContext = {
      message: dto.message,
      status: RematchStatus.PENDING,
      requestedAt: new Date(),
      requestedBy: sourceUser.id,
    };

    match.rematchContext = rematchContext;

    this.addMatchEvent(match, {
      event: InteractionEventType.REMATCH_REQUEST,
      initiatedBy: sourceUser.id,
      metadata: {
        message: dto.message,
      },
    });

    await this.em.persistAndFlush(match);

    setImmediate(async () => {
      try {
        await this.notificationService.sendNotification({
          userId: targetUser.id,
          type: NotificationType.REMATCH_REQUEST,
          data: {
            fromUserId: sourceUser.id,
            fromUserName: sourceUser.firstName,
            message: dto.message,
            matchId: matchId,
          },
        });
      } catch (error) {
        this.logger.error(
          'Failed to send rematch request notification:',
          error,
        );
      }
    });

    return { message: 'Rematch request sent successfully' };
  }

  async respondToRematch(
    authUser: AuthenticatedUser,
    dto: RematchResponseDto,
  ): Promise<{ message: string; chatId?: string }> {
    const targetUser = await this.userRepo.findOneOrFail({
      id: authUser.userId!,
    });

    const match = await this.matchRepo.findOne({
      matchId: dto.matchId,
      isUnmatched: true,
      $or: [{ sourceUserId: targetUser.id }, { targetUserId: targetUser.id }],
    });

    if (
      !match?.rematchContext ||
      match.rematchContext.status !== RematchStatus.PENDING
    ) {
      throw new Error('No pending rematch request found');
    }

    const requesterId = match.rematchContext?.requestedBy;

    const isRequestedByCurrentUser = requesterId === targetUser.id;

    if (isRequestedByCurrentUser) {
      throw new Error('You cannot respond to your own rematch request');
    }

    const now = new Date();
    match.rematchContext = {
      ...match.rematchContext,
      status:
        dto.action === 'accept'
          ? RematchStatus.ACCEPTED
          : RematchStatus.REJECTED,
      respondedAt: now,
      respondedBy: targetUser.id,
    };

    this.addMatchEvent(match, {
      event:
        dto.action === 'accept'
          ? InteractionEventType.REMATCH_ACCEPTED
          : InteractionEventType.REMATCH_REJECTED,
      initiatedBy: targetUser.id,
    });

    let chatId: string | undefined;

    if (dto.action === 'accept') {
      match.isUnmatched = false;
      match.unmatchedAt = undefined;
      match.unmatchedBy = undefined;
      match.unmatchReason = undefined;
      match.unmatchMessage = undefined;

      await this.chatService.unarchiveChat(dto.matchId, targetUser.id);
    }

    await this.em.persistAndFlush(match);

    if (requesterId) {
      setImmediate(async () => {
        try {
          await this.notificationService.sendNotification({
            userId: requesterId,
            type:
              dto.action === 'accept'
                ? NotificationType.REMATCH_ACCEPTED
                : NotificationType.REMATCH_REJECTED,
            data: {
              fromUserId: targetUser.id,
              fromUserName: targetUser.firstName,
              message: dto.action,
              chatId: chatId,
            },
          });
        } catch (error) {
          this.logger.error(
            'Failed to send rematch response notification:',
            error,
          );
        }
      });
    }

    return {
      message:
        dto.action === 'accept'
          ? 'Rematch accepted successfully'
          : 'Rematch request rejected',
      chatId,
    };
  }

  private async archiveChatForUnmatch(
    userId1: string,
    userId2: string,
    profileType: ProfileType,
  ): Promise<void> {
    try {
      const matchId = this.generateMatchId(userId1, userId2, profileType);

      const chat = await this.chatService.getChatByMatchId(matchId);

      if (chat) {
        await this.chatService.archiveChat(chat._id.toString(), userId1);
      }
    } catch (error) {
      this.logger.error('Failed to archive chat for unmatch:', error);
    }
  }

  private buildResponse(
    interaction: ProfileInteraction,
    _profileType: ProfileType,
  ): InteractionResponseDto {
    const baseResponse: InteractionResponseDto = {
      id: interaction.id,
      type: interaction.type,
      profileType: interaction.profileType,
      targetUserId: interaction.targetUser.id,
      targetUser: {
        id: interaction.targetUser.id,
        firstName: interaction.targetUser.firstName,
        lastName: interaction.targetUser.lastName,
        photos: [], // TODO: Populate actual photos
      },
      isMatch: interaction.isMatch,
      matchedAt: interaction.matchedAt,
      createdAt: interaction.createdAt || new Date(),
      // Enhanced analytics data
      isUnmatched: interaction.match?.isUnmatched || false,
      unmatchedAt: interaction.match?.unmatchedAt,
      unmatchReason: interaction.match?.unmatchReason,
      unmatchMessage: interaction.match?.unmatchMessage,
      // Rematch context for chat display
      rematchContext: interaction.match?.rematchContext,
      // Historical data for analytics
      matchEvents: interaction.match?.matchEvents,
    };

    return baseResponse;
  }

  private mapInteractionToDto(
    interaction: ProfileInteraction,
    _profileType: ProfileType,
  ): InteractionResponseDto {
    return {
      id: interaction.id,
      type: interaction.type,
      profileType: interaction.profileType,
      targetUserId: interaction.targetUser.id,
      targetUser: {
        id: interaction.targetUser.id,
        firstName: interaction.targetUser.firstName,
        lastName: interaction.targetUser.lastName,
        photos: [], // TODO: Populate actual photos
      },
      isMatch: interaction.isMatch,
      matchedAt: interaction.matchedAt,
      createdAt: interaction.createdAt || new Date(),
      // Enhanced analytics data
      isUnmatched: interaction.match?.isUnmatched || false,
      unmatchedAt: interaction.match?.unmatchedAt,
      unmatchReason: interaction.match?.unmatchReason,
      unmatchMessage: interaction.match?.unmatchMessage,
      // Rematch context for chat display
      rematchContext: interaction.match?.rematchContext,
      // Historical data for analytics
      matchEvents: interaction.match?.matchEvents,
    };
  }

  private mapMatchToDto(
    match: ProfileInteraction,
    _profileType: ProfileType,
  ): MatchResponseDto {
    return {
      isMatch: match.isMatch,
      targetUser: {
        id: match.targetUser.id,
        firstName: match.targetUser.firstName,
        lastName: match.targetUser.lastName,
        photos: [], // TODO: Populate actual photos
      },
      matchedAt: match.matchedAt,
      expiresAt: undefined, // For client-side countdown timer - not applicable for all profile types
    };
  }
}
