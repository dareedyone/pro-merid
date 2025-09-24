import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/guards/roles.decorator';
import { UserType } from 'src/common/types/enums/user.enum';
import {
  SubscriptionAnalyticsService,
  SubscriptionAnalytics,
  SubscriptionTrends,
} from '../services/analytics-subscription.service';

@Controller('subscription/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
export class SubscriptionAnalyticsController {
  constructor(
    private readonly analyticsService: SubscriptionAnalyticsService,
  ) {}

  @Get()
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    return this.analyticsService.getSubscriptionAnalytics();
  }

  @Get('trends')
  async getSubscriptionTrends(
    @Query('days') days?: string,
  ): Promise<SubscriptionTrends> {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getSubscriptionTrends(daysNumber);
  }

  @Get('user')
  async getUserSubscriptionMetrics(@Req() req: Request) {
    const userId = req?.user?.sub;
    return this.analyticsService.getUserSubscriptionMetrics(userId);
  }
}
