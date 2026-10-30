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
      findOne: jest.fn(),
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

    service = module.get<SubscriptionAnalyticsService>(
      SubscriptionAnalyticsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscriptionAnalytics', () => {
    beforeEach(() => {
      mockConnection.execute.mockReset();
      mockSubscriptionHistoryRepo.count.mockReset();
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
        revenue: {
          total: 50000,
          thisMonth: 5000,
          lastMonth: 4500,
          growth: expect.any(Number),
        },
        subscriptionsByType: {
          control: 200,
          truefynd: 100,
        },
        subscriptionsByProfile: {
          dating: 600,
          friends: 400,
        },
        churnRate: expect.any(Number),
        averageSubscriptionDuration: 30.5,
      });
    });

    it('should calculate revenue growth correctly', async () => {
      const result = await service.getSubscriptionAnalytics();

      // Revenue growth should be (5000 - 4500) / 4500 * 100 = 11.11%
      expect(result.revenue.growth).toBeCloseTo(11.11, 1);
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
          {
            month_start: '2024-01-01',
            subscriptions: '200',
            revenue: '20000.00',
          },
        ]); // monthly trends
    });

    it('should return trends for all periods', async () => {
      // getSubscriptionTrends takes days as a number
      const days = 30;

      // Clear any previous mocks
      mockConnection.execute.mockReset();

      // Mock the internal methods that getSubscriptionTrends calls
      jest.spyOn(service as any, 'getDailyTrends').mockResolvedValue([
        { date: '2024-01-01', subscriptions: 10, revenue: 1000 },
        { date: '2024-01-02', subscriptions: 15, revenue: 1500 },
      ]);
      jest.spyOn(service as any, 'getWeeklyTrends').mockResolvedValue([
        { week: '2024-01-01 to 2024-01-07', subscriptions: 50, revenue: 5000 },
        { week: '2024-01-08 to 2024-01-14', subscriptions: 60, revenue: 6000 },
      ]);
      jest
        .spyOn(service as any, 'getMonthlyTrends')
        .mockResolvedValue([
          { month: '2024-01', subscriptions: 200, revenue: 20000 },
        ]);

      const result = await service.getSubscriptionTrends(days);

      expect(result).toEqual({
        daily: [
          { date: '2024-01-01', subscriptions: 10, revenue: 1000 },
          { date: '2024-01-02', subscriptions: 15, revenue: 1500 },
        ],
        weekly: [
          {
            week: '2024-01-01 to 2024-01-07',
            subscriptions: 50,
            revenue: 5000,
          },
          {
            week: '2024-01-08 to 2024-01-14',
            subscriptions: 60,
            revenue: 6000,
          },
        ],
        monthly: [{ month: '2024-01', subscriptions: 200, revenue: 20000 }],
      });
    });
  });

  describe('getUserSubscriptionMetrics', () => {
    beforeEach(() => {
      // Reset mocks
      mockConnection.execute.mockReset();
      mockSubscriptionHistoryRepo.count.mockReset();
      mockSubscriptionHistoryRepo.findOne.mockReset();
    });

    it('should return user metrics', async () => {
      const userId = 'user-123';
      const mockPurchasedAt = new Date('2024-01-15');

      // The service calls these in parallel via Promise.all, so we need to set them up in order
      mockConnection.execute
        .mockResolvedValueOnce([{ total: '1500.00' }]) // totalSpent - first execute call
        .mockResolvedValueOnce([{ avg_days: '45.5' }]) // averageDuration - second execute call
        .mockResolvedValueOnce([
          { subscription_type: 'control', count: '5' },
          { subscription_type: 'truefynd', count: '2' },
        ]); // subscriptionTypeCounts - third execute call

      mockSubscriptionHistoryRepo.count.mockResolvedValueOnce(7); // subscriptionCount
      mockSubscriptionHistoryRepo.findOne.mockResolvedValueOnce({
        purchasedAt: mockPurchasedAt,
      }); // lastSubscription

      const result = await service.getUserSubscriptionMetrics(userId);

      expect(result).toEqual({
        totalSpent: 1500,
        subscriptionCount: 7,
        averageSubscriptionDuration: 45.5,
        lastSubscriptionDate: mockPurchasedAt,
        preferredSubscriptionType: 'control',
      });
    });

    it('should handle user with no subscriptions', async () => {
      const userId = 'user-123';

      // The service calls these in parallel via Promise.all
      mockConnection.execute
        .mockResolvedValueOnce([{ total: '0.00' }]) // totalSpent - first execute call
        .mockResolvedValueOnce([{ avg_days: null }]) // averageDuration - second execute call
        .mockResolvedValueOnce([]); // subscriptionTypeCounts (empty) - third execute call

      mockSubscriptionHistoryRepo.count.mockResolvedValueOnce(0); // subscriptionCount
      mockSubscriptionHistoryRepo.findOne.mockResolvedValueOnce(null); // lastSubscription

      const result = await service.getUserSubscriptionMetrics(userId);

      expect(result).toEqual({
        totalSpent: 0,
        subscriptionCount: 0,
        averageSubscriptionDuration: 0,
        lastSubscriptionDate: null,
        preferredSubscriptionType: null,
      });
    });
  });

  describe('getDailyTrends', () => {
    beforeEach(() => {
      mockConnection.execute.mockReset();
    });

    it('should return daily trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      // Mock returns raw database format (strings)
      mockConnection.execute.mockResolvedValue([
        { date: '2024-01-01', subscriptions: '10', revenue: '1000.00' },
        { date: '2024-01-02', subscriptions: '15', revenue: '1500.00' },
      ]);

      const result = await (service as any).getDailyTrends(startDate, endDate);

      // Service transforms strings to numbers
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
    beforeEach(() => {
      mockConnection.execute.mockReset();
    });

    it('should return weekly trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock returns raw database format - week_start is a Date string from PostgreSQL DATE_TRUNC
      // PostgreSQL returns dates as strings, so we need to provide valid date strings
      const week1 = new Date('2024-01-01T00:00:00.000Z');
      const week2 = new Date('2024-01-08T00:00:00.000Z');
      mockConnection.execute.mockResolvedValue([
        { week_start: week1, subscriptions: '50', revenue: '5000.00' },
        { week_start: week2, subscriptions: '60', revenue: '6000.00' },
      ]);

      const result = await (service as any).getWeeklyTrends(startDate, endDate);

      // Service transforms: week_start Date -> "YYYY-MM-DD to YYYY-MM-DD" format
      const weekEnd1 = new Date(week1);
      weekEnd1.setDate(weekEnd1.getDate() + 6);
      const weekEnd2 = new Date(week2);
      weekEnd2.setDate(weekEnd2.getDate() + 6);

      expect(result).toEqual([
        {
          week: `${week1.toISOString().split('T')[0]} to ${weekEnd1.toISOString().split('T')[0]}`,
          subscriptions: 50,
          revenue: 5000,
        },
        {
          week: `${week2.toISOString().split('T')[0]} to ${weekEnd2.toISOString().split('T')[0]}`,
          subscriptions: 60,
          revenue: 6000,
        },
      ]);
    });
  });

  describe('getMonthlyTrends', () => {
    beforeEach(() => {
      mockConnection.execute.mockReset();
    });

    it('should return monthly trends', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock returns raw database format - month_start is a Date from PostgreSQL DATE_TRUNC
      const month1 = new Date('2024-01-01T00:00:00.000Z');
      const month2 = new Date('2024-02-01T00:00:00.000Z');
      mockConnection.execute.mockResolvedValue([
        { month_start: month1, subscriptions: '200', revenue: '20000.00' },
        { month_start: month2, subscriptions: '250', revenue: '25000.00' },
      ]);

      const result = await (service as any).getMonthlyTrends(
        startDate,
        endDate,
      );

      // Service transforms: month_start Date -> "YYYY-MM" format
      expect(result).toEqual([
        { month: '2024-01', subscriptions: 200, revenue: 20000 },
        { month: '2024-02', subscriptions: 250, revenue: 25000 },
      ]);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockConnection.execute.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.getSubscriptionAnalytics()).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle empty results', async () => {
      mockSubscriptionHistoryRepo.count.mockResolvedValue(0);
      mockConnection.execute.mockResolvedValue([{ total: '0.00' }]);

      const result = await service.getSubscriptionAnalytics();

      expect(result.totalSubscriptions).toBe(0);
      expect(result.revenue.total).toBe(0);
    });
  });
});
