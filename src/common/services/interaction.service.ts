import { Injectable, Logger } from '@nestjs/common';
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

  private generateMatchId(
    profileId1: string,
    profileId2: string,
    profileType: ProfileType,
  ): string {
    const [firstId, secondId] = [profileId1, profileId2].sort();
    return `${firstId}-${secondId}-${profileType}`;
  }

  private async getOrCreateMatch(
    matchId: string,
    profileType: ProfileType,
    matchedAt: Date,
    sourceUserId: string,
    targetUserId: string,
  ): Promise<Match> {
    let match = await this.matchRepo.findOne({ id: matchId });

    if (!match) {
      match = this.matchRepo.create({
        id: matchId,
        profileType,
        matchedAt,
        sourceUserId,
        targetUserId,
        isUnmatched: false,
      });
      await this.em.persist(match);
    }

    return match;
  }

  async createInteraction(
    authId: string,
    dto: CreateInteractionDto,
  ): Promise<InteractionResponseDto> {
    const { user: sourceUser } = await this.authService.fetchAuthUser(authId);
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
          sourceProfileId: sourceUser.id,
          targetProfileId: targetUser.id,
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
          sourceProfileId: sourceUser.id,
          targetProfileId: targetUser.id,
          interactionDate: new Date(),
          isMatch: false,
        });

        await em.persist(interaction);

        let isMatch = false;
        let matchedAt: Date | undefined;

        const reverseInteraction = await em.findOne(ProfileInteraction, {
          sourceUser: targetUser,
          targetUser: sourceUser,
          sourceProfileId: targetUser.id,
          targetProfileId: sourceUser.id,
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

          const match = await this.getOrCreateMatch(
            matchId,
            profileType,
            matchedAt,
            sourceUser.id,
            targetUser.id,
          );

          this.addMatchEvent(match, {
            event: InteractionEventType.INITIAL_MATCH,
            initiatedBy: sourceUser.id,
          });

          interaction.isMatch = true;
          interaction.matchedAt = matchedAt;
          interaction.match = match;
          reverseInteraction.isMatch = true;
          reverseInteraction.matchedAt = matchedAt;
          reverseInteraction.match = match;

          await em.persist([interaction, reverseInteraction, match]);
        }

        await em.flush();

        if (isMatch) {
          setImmediate(async () => {
            try {
              await this.notificationService.sendNotification({
                userId: sourceUser.id,
                type: NotificationType.MATCH,
                data: {
                  matchedUserId: targetUser.id,
                  matchedUserName: targetUser.firstName,
                  chatId: undefined,
                },
              });

              await this.notificationService.sendNotification({
                userId: targetUser.id,
                type: NotificationType.MATCH,
                data: {
                  matchedUserId: sourceUser.id,
                  matchedUserName: sourceUser.firstName,
                  chatId: undefined,
                },
              });
            } catch (error) {
              this.logger.error('Failed to send match notifications:', error);
            }
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
            sourceProfileId: sourceUser.id,
            targetProfileId: targetUser.id,
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

  async unmatch(authId: string, dto: UnmatchDto): Promise<{ message: string }> {
    const { user: sourceUser } = await this.authService.fetchAuthUser(authId);
    const targetUserId = dto.targetUserId;
    const profileType = dto.profileType;

    const matchId = this.generateMatchId(
      sourceUser.id,
      targetUserId,
      profileType,
    );

    const match = await this.matchRepo.findOneOrFail({
      id: matchId,
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
    authId: string,
    profileType: ProfileType,
    page: number = 1,
    limit: number = 20,
  ): Promise<InteractionResponseDto[]> {
    const { user } = await this.authService.fetchAuthUser(authId);
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
    authId: string,
    profileType: ProfileType,
  ): Promise<MatchResponseDto[]> {
    const { user } = await this.authService.fetchAuthUser(authId);

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
    authId: string,
    type: InteractionType,
    profileType: ProfileType,
  ): Promise<number> {
    const { user } = await this.authService.fetchAuthUser(authId);

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

  async requestRematch?(
    _authId: string,
    _dto: RematchRequestDto,
  ): Promise<{ message: string }> {
    throw new Error('requestRematch not supported for this profile type');
  }

  async respondToRematch?(
    _authId: string,
    _dto: RematchResponseDto,
  ): Promise<{ message: string }> {
    throw new Error('respondToRematch not supported for this profile type');
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
