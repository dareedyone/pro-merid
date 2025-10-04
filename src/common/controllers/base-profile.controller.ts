import {
  Post,
  Body,
  Patch,
  Req,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfileType } from '../types/enums/other.enum';
import { AuthService } from '../../feature/auth/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { UserType } from '../types/enums/user.enum';
import { InteractionService } from '../services/interaction.service';
import { BaseProfileService } from '../services/base-profile.service';
import { SubscriptionService } from '../../feature/subscription/services/subscription.service';
import {
  CreateInteractionDto,
  UnmatchDto,
  RematchRequestDto,
  RematchResponseDto,
} from '../dtos/interaction.dto';
import {
  SubscriptionStatusDto,
  SubscriptionPlanDto,
  PurchaseSubscriptionDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
} from '../../feature/subscription/dtos/subscription.dto';
import {
  PaginationQueryDto,
  DailyCountQueryDto,
  CheckInteractionQueryDto,
} from '../dtos/query.dto';
import {
  CreateProfileDto,
  UpdateProfileDto,
  UpdateFilterDto,
} from '../dtos/profile.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.USER)
export abstract class BaseProfileController {
  constructor(
    protected readonly profileService: BaseProfileService,
    protected readonly interactionService: InteractionService,
    protected readonly authService: AuthService,
    protected readonly subscriptionService: SubscriptionService,
  ) {}

  protected abstract get profileType(): ProfileType;

  @Post()
  createProfile(@Req() req: Request, @Body() dto: CreateProfileDto) {
    const authUser = req?.user;
    return this.profileService.addProfile(authUser, dto);
  }

  @Patch()
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const authUser = req?.user;
    return this.profileService.updateProfile(authUser, dto);
  }

  @Patch('filter')
  updateFilter(@Req() req: Request, @Body() dto: UpdateFilterDto) {
    if (!this.profileService.updateFilter) {
      throw new Error('Filter management not supported for this profile type');
    }
    const authUser = req?.user;
    return this.profileService.updateFilter(authUser, dto);
  }

  @Get('matches/potential')
  findPotentialMatches(
    @Req() req: Request,
    @Query('locationProfileId') locationProfileId?: string,
  ) {
    if (!this.profileService.findPotentialMatches) {
      throw new Error('Potential matches not supported for this profile type');
    }
    const authUser = req?.user;
    return this.profileService.findPotentialMatches(
      authUser,
      locationProfileId,
    );
  }

  @Post('interactions')
  async createInteraction(
    @Req() req: Request,
    @Body() dto: CreateInteractionDto,
  ) {
    const authUser = req?.user;
    return await this.interactionService.createInteraction(authUser, dto);
  }

  @Post('interactions/unmatch')
  async unmatch(@Req() req: Request, @Body() dto: UnmatchDto) {
    const authUser = req?.user;
    return await this.interactionService.unmatch(authUser, dto);
  }

  @Get('interactions/history')
  async getInteractionHistory(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
  ) {
    const authUser = req?.user;
    return await this.interactionService.getInteractionHistory(
      authUser,
      this.profileType,
      query.page,
      query.limit,
    );
  }

  @Get('interactions/matches')
  async getMatches(@Req() req: Request) {
    const authUser = req?.user;
    return await this.interactionService.getMatches(authUser, this.profileType);
  }

  @Get('interactions/daily-count')
  async getDailyCount(@Req() req: Request, @Query() query: DailyCountQueryDto) {
    const authUser = req?.user;
    return await this.interactionService.getDailyInteractionCount(
      authUser,
      query.type,
      this.profileType,
    );
  }

  @Get('interactions/check/:targetUserId')
  async checkInteraction(
    @Req() req: Request,
    @Param('targetUserId') targetUserId: string,
    @Query() query: CheckInteractionQueryDto,
  ) {
    const authUser = req?.user;
    return await this.interactionService.hasInteraction(
      authUser.userId!,
      targetUserId,
      query.type,
      this.profileType,
    );
  }

  @Get('interactions/between/:targetUserId')
  async getInteractionsBetweenUsers(
    @Req() req: Request,
    @Param('targetUserId') targetUserId: string,
  ) {
    const authUser = req?.user;
    return await this.interactionService.getInteractionsBetweenUsers(
      authUser.userId!,
      targetUserId,
    );
  }

  @Get('interactions/match-status/:targetUserId')
  async getMatchStatus(
    @Req() req: Request,
    @Param('targetUserId') targetUserId: string,
  ) {
    const authUser = req?.user;
    return await this.interactionService.areUsersMatched(
      authUser.userId!,
      targetUserId,
    );
  }

  @Post('interactions/rematch/request')
  async requestRematch(@Req() req: Request, @Body() dto: RematchRequestDto) {
    if (!this.interactionService.requestRematch) {
      throw new Error('Re-match not supported for this profile type');
    }
    const authUser = req?.user;
    return await this.interactionService.requestRematch(authUser, dto);
  }

  @Post('interactions/rematch/respond')
  async respondToRematch(@Req() req: Request, @Body() dto: RematchResponseDto) {
    if (!this.interactionService.respondToRematch) {
      throw new Error('Re-match not supported for this profile type');
    }
    const authUser = req?.user;
    return await this.interactionService.respondToRematch(authUser, dto);
  }

  // Subscription endpoints

  @Get('subscription/plans')
  getSubscriptionPlans(): SubscriptionPlanDto[] {
    return this.subscriptionService.getSubscriptionPlans(this.profileType);
  }

  @Get('subscription/status')
  async getSubscriptionStatus(
    @Req() req: Request,
  ): Promise<SubscriptionStatusDto> {
    const authUser = req?.user;
    return this.subscriptionService.getSubscriptionStatus(
      authUser,
      this.profileType,
    );
  }

  @Post('subscription/purchase')
  async purchaseSubscription(
    @Req() req: Request,
    @Body() dto: Omit<PurchaseSubscriptionDto, 'profileType'>,
  ): Promise<SubscriptionStatusDto> {
    const authUser = req?.user;
    return this.subscriptionService.purchaseSubscription(authUser, {
      ...dto,
      profileType: this.profileType,
    });
  }

  @Post('subscription/renew')
  async renewSubscription(
    @Req() req: Request,
    @Body() dto: Omit<RenewSubscriptionDto, 'profileType'>,
  ): Promise<SubscriptionStatusDto> {
    const authUser = req?.user;
    return this.subscriptionService.renewSubscription(authUser, {
      ...dto,
      profileType: this.profileType,
    });
  }

  @Post('subscription/cancel')
  async cancelSubscription(
    @Req() req: Request,
    @Body() dto: Omit<CancelSubscriptionDto, 'profileType'>,
  ): Promise<{ message: string }> {
    const authUser = req?.user;
    return this.subscriptionService.cancelSubscription(authUser, {
      ...dto,
      profileType: this.profileType,
    });
  }
}
