import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { SubscriptionAnalyticsService } from './analytics-subscription.service';
import { SubscriptionHistory } from '../entities/subscription-history.entity';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { SubscriptionStatus } from '../dtos/subscription.dto';
import { SubscriptionAction } from '../entities/subscription-history.entity';

describe('SubscriptionAnalyticsService', () => {
  let service: SubscriptionAnalyticsService;
  let mockSubscriptionHistoryRepo: any;
  let mockEntityManager: any;

  const mockConnection = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    mockSubscriptionHistoryRepo = {
      count: jest.fn(),
    };

    mockEntityManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionAnalyticsService,
        {
          provide: getRepositoryToken(SubscriptionHistory),
          useValue: mockSubscriptionHistoryRepo,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<SubscriptionAnalyticsService>(SubscriptionAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscriptionAnalytics', () => {
    beforeEach(() => {
      // Mock database queries
      mockSubscriptionHistoryRepo.count
        .mockResolvedValueOnce(1000) // totalSubscriptions
        .mockResolvedValueOnce(800) // activeSubscriptions
        .mockResolvedValueOnce(150) // expiredSubscriptions
        .mockResolvedValueOnce(50) // cancelledSubscriptions
        .mockResolvedValueOnce(200) // controlSubscriptions
        .mockResolvedValueOnce(100) // truefyndSubscriptions
        .mockResolvedValueOnce(600) // datingSubscriptions
        .mockResolvedValueOnce(400) // friendsSubscriptions
        .mockResolvedValueOnce(50) // activeInLast30Days
        .mockResolvedValueOnce(0); // averageDurationResult

      mockConnection.execute
        .mockResolvedValueOnce([{ total: '50000.00' }]) // totalRevenue
        .mockResolvedValueOnce([{ total: '5000.00' }]) // thisMonthRevenue
        .mockResolvedValueOnce([{ total: '4500.00' }]) // lastMonthRevenue
        .mockResolvedValueOnce([{ avg_days: '30.5' }]); // averageDurationResult
    });

    it('should return comprehensive analytics', async () => {
      const result = await service.getSubscriptionAnalytics();

      expect(result).toEqual({
        totalSubscriptions: 1000,
        activeSubscriptions: 800,
        expiredSubscriptions: 150,
        cancelledSubscriptions: 50,
        totalRevenue: 50000,
        thisMonthRevenue: 5000,
        lastMonthRevenue: 4500,
        revenueGrowth: expect.any(Number),
        controlSubscriptions: 200,
        truefyndSubscriptions: 100,
        datingSubscriptions: 600,
        friendsSubscriptions: 400,
        activeInLast30Days: 50,
        churnRate: expect.any(Number),
        averageDuration: 30.5,
        averageDurationDays: 30.5,
      });
    });

    it('should calculate revenue growth correctly', async () => {
      const result = await service.getSubscriptionAnalytics();

      // Revenue growth should be (5000 - 4500) / 4500 * 100 = 11.11%
      expect(result.revenueGrowth).toBeCloseTo(11.11, 1);
    });

    it('should calculate churn rate correctly', async () => {
      const result = await service.getSubscriptionAnalytics();

      // Churn rate should be (50 / 50) * 100 = 100% (since activeInLast30Days = 50, cancelled = 50)
      expect(result.churnRate).toBe(100);
    });
  });

  describe('getSubscriptionTrends', () => {
    beforeEach(() => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockConnection.execute
        .mockResolvedValueOnce([
          { date: '2024-01-01', subscriptions: '10', revenue: '1000.00' },
          { date: '2024-01-02', subscriptions: '15', revenue: '1500.00' },
        ]) // daily trends
        .mockResolvedValueOnce([
          { week_start: '2024-01-01', subscriptions: '50', revenue: '5000.00' },
          { week_start: '2024-01-08', subscriptions: '60', revenue: '6000.00' },
        ]) // weekly trends
        .mockResolvedValueOnce([
          { month_start: '2024-01-01', subscriptions: '200', revenue: '20000.00' },
        ]); // monthly trends
    });

    it('should return trends for all periods', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await service.getSubscriptionTrends(startDate, endDate);

      expect(result).toEqual({
        daily: [
          { date: '2024-01-01', subscriptions: 10, revenue: 1000 },
          { date: '2024-01-02', subscriptions: 15, revenue: 1500 },
        ],
        weekly: [
          { week: '2024-01-01', subscriptions: 50, revenue: 5000 },
          { week: '2024-01-08', subscriptions: 60, revenue: 6000 },
        ],
        monthly: [
          { month: '2024-01-01', subscriptions: 200, revenue: 20000 },
        ],
      });
    });
  });

  describe('getUserSubscriptionMetrics', () => {
    beforeEach(() => {
      mockConnection.execute
        .mockResolvedValueOnce([{ total_spent: '1500.00' }]) // total spent
        .mockResolvedValueOnce([{ avg_duration: '45.5' }]) // average duration
        .mockResolvedValueOnce([
          { subscription_type: 'control', count: '5' },
          { subscription_type: 'truefynd', count: '2' },
        ]); // subscription type counts

      mockSubscriptionHistoryRepo.count
        .mockResolvedValueOnce(7) // total subscriptions
        .mockResolvedValueOnce(3); // active subscriptions
    });

    it('should return user metrics', async () => {
      const result = await service.getUserSubscriptionMetrics('user-123');

      expect(result).toEqual({
        totalSpent: 1500,
        totalSubscriptions: 7,
        activeSubscriptions: 3,
        averageDuration: 45.5,
        averageDurationDays: 45.5,
        preferredSubscriptionType: 'control',
      });
    });

    it('should handle user with no subscriptions', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([{ total_spent: '0.00' }])
        .mockResolvedValueOnce([{ avg_duration: '0' }])
        .mockResolvedValueOnce([]);

      mockSubscriptionHistoryRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getUserSubscriptionMetrics('user-123');

      expect(result).toEqual({
        totalSpent: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        averageDuration: 0,
        averageDurationDays: 0,
        preferredSubscriptionType: null,
      });
    });
  });

  describe('getDailyTrends', () => {
    it('should return daily trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      mockConnection.execute.mockResolvedValueOnce([
        { date: '2024-01-01', subscriptions: '10', revenue: '1000.00' },
        { date: '2024-01-02', subscriptions: '15', revenue: '1500.00' },
      ]);

      const result = await (service as any).getDailyTrends(startDate, endDate);

      expect(result).toEqual([
        { date: '2024-01-01', subscriptions: 10, revenue: 1000 },
        { date: '2024-01-02', subscriptions: 15, revenue: 1500 },
      ]);

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT DATE(purchased_at) as date, COUNT(*) as subscriptions, COALESCE(SUM(amount), 0) as revenue FROM subscription_history WHERE purchased_at >= ? AND purchased_at <= ? GROUP BY DATE(purchased_at) ORDER BY DATE(purchased_at) ASC',
        [startDate, endDate],
      );
    });
  });

  describe('getWeeklyTrends', () => {
    it('should return weekly trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockConnection.execute.mockResolvedValueOnce([
        { week_start: '2024-01-01', subscriptions: '50', revenue: '5000.00' },
        { week_start: '2024-01-08', subscriptions: '60', revenue: '6000.00' },
      ]);

      const result = await (service as any).getWeeklyTrends(startDate, endDate);

      expect(result).toEqual([
        { week: '2024-01-01', subscriptions: 50, revenue: 5000 },
        { week: '2024-01-08', subscriptions: 60, revenue: 6000 },
      ]);
    });
  });

  describe('getMonthlyTrends', () => {
    it('should return monthly trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockConnection.execute.mockResolvedValueOnce([
        { month_start: '2024-01-01', subscriptions: '200', revenue: '20000.00' },
        { month_start: '2024-02-01', subscriptions: '250', revenue: '25000.00' },
      ]);

      const result = await (service as any).getMonthlyTrends(startDate, endDate);

      expect(result).toEqual([
        { month: '2024-01-01', subscriptions: 200, revenue: 20000 },
        { month: '2024-02-01', subscriptions: 250, revenue: 25000 },
      ]);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockConnection.execute.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getSubscriptionAnalytics()).rejects.toThrow('Database error');
    });

    it('should handle empty results', async () => {
      mockSubscriptionHistoryRepo.count.mockResolvedValue(0);
      mockConnection.execute.mockResolvedValue([{ total: '0.00' }]);

      const result = await service.getSubscriptionAnalytics();

      expect(result.totalSubscriptions).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });
  });
});
