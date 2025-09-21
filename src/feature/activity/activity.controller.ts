import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user/user.entity';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * Heartbeat endpoint - minimal fallback for activity tracking
   * Use cases:
   * - App launch (before WebSocket connection is established)
   * - Fallback when WebSocket is unavailable
   * - Background activity that doesn't involve chat
   *
   * Note: Primary activity tracking is handled via WebSocket connections in ChatGateway
   */
  @Post('heartbeat')
  async heartbeat(@CurrentUser() user: User): Promise<{
    success: boolean;
    message: string;
    timestamp: Date;
  }> {
    await this.activityService.updateLastSeen(user.id);
    return {
      success: true,
      message: 'Activity updated via fallback heartbeat',
      timestamp: new Date(),
    };
  }

  /**
   * Get user's last seen timestamp
   */
  @Get('last-seen')
  async getLastSeen(
    @CurrentUser() user: User,
  ): Promise<{ lastSeenAt: Date | null }> {
    const lastSeenAt = await this.activityService.getLastSeen(user.id);
    return { lastSeenAt };
  }

  /**
   * Get activity stats (for admin/monitoring)
   */
  @Get('stats')
  async getStats() {
    return await this.activityService.getActivityStats();
  }
}
