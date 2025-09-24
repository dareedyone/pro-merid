import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  SubscriptionHistory,
  SubscriptionAction,
} from '../entities/subscription-history.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionStatus } from '../dtos/subscription.dto';

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  subscriptionsByType: {
    control: number;
    truefynd: number;
  };
  subscriptionsByProfile: {
    dating: number;
    friends: number;
  };
  churnRate: number;
  averageSubscriptionDuration: number;
}

export interface SubscriptionTrends {
  daily: Array<{ date: string; subscriptions: number; revenue: number }>;
  weekly: Array<{ week: string; subscriptions: number; revenue: number }>;
  monthly: Array<{ month: string; subscriptions: number; revenue: number }>;
}

@Injectable()
export class SubscriptionAnalyticsService {
  constructor(
    @InjectRepository(SubscriptionHistory)
    private readonly subscriptionHistoryRepo: EntityRepository<SubscriptionHistory>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Get comprehensive subscription analytics using database queries
   */
  async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      controlSubscriptions,
      truefyndSubscriptions,
      datingSubscriptions,
      friendsSubscriptions,
      activeInLast30Days,
      averageDurationResult,
    ] = await Promise.all([
      // Total subscriptions count
      this.subscriptionHistoryRepo.count({}),

      // Active subscriptions (purchased or renewed, not cancelled, not expired)
      this.subscriptionHistoryRepo.count({
        $and: [
          {
            $or: [
              { action: SubscriptionAction.PURCHASED },
              { action: SubscriptionAction.RENEWED },
            ],
          },
          { status: SubscriptionStatus.ACTIVE },
          {
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
          },
        ],
      }),

      // Expired subscriptions
      this.subscriptionHistoryRepo.count({
        $or: [
          { status: SubscriptionStatus.EXPIRED },
          { expiresAt: { $lte: now } },
        ],
      }),

      // Cancelled subscriptions
      this.subscriptionHistoryRepo.count({
        action: SubscriptionAction.CANCELLED,
      }),

      // Total revenue
      this.em
        .getConnection()
        .execute(
          'SELECT COALESCE(SUM(amount), 0) as total FROM subscription_history',
        )
        .then((result: any) => parseFloat(result[0]?.total || '0')),

      // This month revenue
      this.em
        .getConnection()
        .execute(
          'SELECT COALESCE(SUM(amount), 0) as total FROM subscription_history WHERE purchased_at >= ?',
          [startOfMonth],
        )
        .then((result: any) => parseFloat(result[0]?.total || '0')),

      // Last month revenue
      this.em
        .getConnection()
        .execute(
          'SELECT COALESCE(SUM(amount), 0) as total FROM subscription_history WHERE purchased_at >= ? AND purchased_at <= ?',
          [startOfLastMonth, endOfLastMonth],
        )
        .then((result: any) => parseFloat(result[0]?.total || '0')),

      // Control subscriptions count
      this.subscriptionHistoryRepo.count({
        subscriptionType: 'control',
      }),

      // TrueFynd subscriptions count
      this.subscriptionHistoryRepo.count({
        subscriptionType: 'truefynd',
      }),

      // Dating subscriptions count
      this.subscriptionHistoryRepo.count({
        profileType: ProfileType.DATE,
      }),

      // Friends subscriptions count
      this.subscriptionHistoryRepo.count({
        profileType: ProfileType.FRIEND,
      }),

      // Active subscriptions in last 30 days
      this.subscriptionHistoryRepo.count({
        $and: [
          { purchasedAt: { $gte: thirtyDaysAgo } },
          { status: SubscriptionStatus.ACTIVE },
        ],
      }),

      // Average subscription duration
      this.em
        .getConnection()
        .execute(
          'SELECT AVG(EXTRACT(EPOCH FROM (expires_at - purchased_at)) / 86400) as avg_days FROM subscription_history WHERE expires_at IS NOT NULL AND status = ?',
          [SubscriptionStatus.ACTIVE],
        )
        .then((result: any) => parseFloat(result[0]?.avg_days || '0')),
    ]);

    // Calculate growth percentage
    const growth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Calculate churn rate
    const churnRate =
      activeInLast30Days > 0
        ? (cancelledSubscriptions / activeInLast30Days) * 100
        : 0;

    return {
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth,
      },
      subscriptionsByType: {
        control: controlSubscriptions,
        truefynd: truefyndSubscriptions,
      },
      subscriptionsByProfile: {
        dating: datingSubscriptions,
        friends: friendsSubscriptions,
      },
      churnRate,
      averageSubscriptionDuration: averageDurationResult,
    };
  }

  /**
   * Get subscription trends over time using database queries
   */
  async getSubscriptionTrends(days: number = 30): Promise<SubscriptionTrends> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Execute trend queries in parallel
    const [dailyData, weeklyData, monthlyData] = await Promise.all([
      this.getDailyTrends(startDate, endDate),
      this.getWeeklyTrends(startDate, endDate),
      this.getMonthlyTrends(startDate, endDate),
    ]);

    return {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    };
  }

  /**
   * Get subscription metrics for a specific user using database queries
   */
  async getUserSubscriptionMetrics(userId: string): Promise<{
    totalSpent: number;
    subscriptionCount: number;
    averageSubscriptionDuration: number;
    lastSubscriptionDate: Date | null;
    preferredSubscriptionType: string | null;
  }> {
    // Execute user metrics queries in parallel
    const [
      totalSpentResult,
      subscriptionCount,
      lastSubscription,
      averageDurationResult,
      subscriptionTypeCounts,
    ] = await Promise.all([
      // Total spent
      this.em
        .getConnection()
        .execute(
          'SELECT COALESCE(SUM(amount), 0) as total FROM subscription_history WHERE user_id = ?',
          [userId],
        )
        .then((result: any) => parseFloat(result[0]?.total || '0')),

      // Subscription count
      this.subscriptionHistoryRepo.count({
        user: { id: userId },
      }),

      // Last subscription date
      this.subscriptionHistoryRepo.findOne(
        { user: { id: userId } },
        { orderBy: { purchasedAt: 'DESC' } },
      ),

      // Average subscription duration
      this.em
        .getConnection()
        .execute(
          'SELECT AVG(EXTRACT(EPOCH FROM (expires_at - purchased_at)) / 86400) as avg_days FROM subscription_history WHERE user_id = ? AND expires_at IS NOT NULL AND status = ?',
          [userId, SubscriptionStatus.ACTIVE],
        )
        .then((result: any) => parseFloat(result[0]?.avg_days || '0')),

      // Subscription type counts
      this.em
        .getConnection()
        .execute(
          'SELECT subscription_type, COUNT(*) as count FROM subscription_history WHERE user_id = ? GROUP BY subscription_type',
          [userId],
        )
        .then((results: any[]) => {
          const counts: Record<string, number> = {};
          results.forEach((row: any) => {
            counts[row.subscription_type] = parseInt(row.count);
          });
          return counts;
        }),
    ]);

    // Find preferred subscription type
    const preferredSubscriptionType =
      Object.keys(subscriptionTypeCounts).length > 0
        ? Object.keys(subscriptionTypeCounts).reduce((a, b) =>
            subscriptionTypeCounts[a] > subscriptionTypeCounts[b] ? a : b,
          )
        : null;

    return {
      totalSpent: totalSpentResult,
      subscriptionCount,
      averageSubscriptionDuration: averageDurationResult,
      lastSubscriptionDate: lastSubscription?.purchasedAt || null,
      preferredSubscriptionType,
    };
  }

  // Private helper methods using database queries

  private async getDailyTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; subscriptions: number; revenue: number }>> {
    const result = await this.em
      .getConnection()
      .execute(
        'SELECT DATE(purchased_at) as date, COUNT(*) as subscriptions, COALESCE(SUM(amount), 0) as revenue FROM subscription_history WHERE purchased_at >= ? AND purchased_at <= ? GROUP BY DATE(purchased_at) ORDER BY DATE(purchased_at) ASC',
        [startDate, endDate],
      );

    return result.map((row: any) => ({
      date: row.date,
      subscriptions: parseInt(row.subscriptions),
      revenue: parseFloat(row.revenue),
    }));
  }

  private async getWeeklyTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ week: string; subscriptions: number; revenue: number }>> {
    const result = await this.em
      .getConnection()
      .execute(
        "SELECT DATE_TRUNC('week', purchased_at) as week_start, COUNT(*) as subscriptions, COALESCE(SUM(amount), 0) as revenue FROM subscription_history WHERE purchased_at >= ? AND purchased_at <= ? GROUP BY DATE_TRUNC('week', purchased_at) ORDER BY DATE_TRUNC('week', purchased_at) ASC",
        [startDate, endDate],
      );

    return result.map((row: any) => {
      const weekStart = new Date(row.week_start);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return {
        week: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
        subscriptions: parseInt(row.subscriptions),
        revenue: parseFloat(row.revenue),
      };
    });
  }

  private async getMonthlyTrends(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ month: string; subscriptions: number; revenue: number }>> {
    const result = await this.em
      .getConnection()
      .execute(
        "SELECT DATE_TRUNC('month', purchased_at) as month_start, COUNT(*) as subscriptions, COALESCE(SUM(amount), 0) as revenue FROM subscription_history WHERE purchased_at >= ? AND purchased_at <= ? GROUP BY DATE_TRUNC('month', purchased_at) ORDER BY DATE_TRUNC('month', purchased_at) ASC",
        [startDate, endDate],
      );

    return result.map((row: any) => {
      const monthStart = new Date(row.month_start);
      return {
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        subscriptions: parseInt(row.subscriptions),
        revenue: parseFloat(row.revenue),
      };
    });
  }
}
