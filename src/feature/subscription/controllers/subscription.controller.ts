import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SubscriptionService } from '../services/subscription.service';
import {
  PurchaseSubscriptionDto,
  SubscriptionStatusDto,
  SubscriptionPlanDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionHistoryDto,
} from '../dtos/subscription.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  getSubscriptionPlans(
    @Query('profileType') profileType: ProfileType,
  ): SubscriptionPlanDto[] {
    return this.subscriptionService.getSubscriptionPlans(profileType);
  }

  @Get('status')
  async getSubscriptionStatus(
    @Req() req: Request,
    @Query('profileType') profileType: ProfileType,
  ): Promise<SubscriptionStatusDto> {
    const authUser = req?.user;
    return this.subscriptionService.getSubscriptionStatus(
      authUser,
      profileType,
    );
  }

  @Post('purchase')
  async purchaseSubscription(
    @Req() req: Request,
    @Body() dto: PurchaseSubscriptionDto,
  ): Promise<SubscriptionStatusDto> {
    const authUser = req?.user;
    return this.subscriptionService.purchaseSubscription(authUser, dto);
  }

  @Post('renew')
  async renewSubscription(
    @Req() req: Request,
    @Body() dto: RenewSubscriptionDto,
  ): Promise<SubscriptionStatusDto> {
    const authUser = req?.user;
    return this.subscriptionService.renewSubscription(authUser, dto);
  }

  @Post('cancel')
  async cancelSubscription(
    @Req() req: Request,
    @Body() dto: CancelSubscriptionDto,
  ): Promise<{ message: string }> {
    const authUser = req?.user;
    return this.subscriptionService.cancelSubscription(authUser, dto);
  }

  @Get('history')
  async getSubscriptionHistory(
    @Req() req: Request,
    @Query('profileType') profileType: ProfileType,
  ): Promise<SubscriptionHistoryDto[]> {
    const authUser = req?.user;
    return this.subscriptionService.getSubscriptionHistory(
      authUser,
      profileType,
    );
  }
}
