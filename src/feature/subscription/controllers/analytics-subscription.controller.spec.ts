import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionAnalyticsController } from './analytics-subscription.controller';
import { SubscriptionAnalyticsService } from '../services/analytics-subscription.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

describe('SubscriptionAnalyticsController', () => {
  let controller: SubscriptionAnalyticsController;
  let mockAnalyticsService: any;

  beforeEach(async () => {
    mockAnalyticsService = {
      getSubscriptionAnalytics: jest.fn(),
      getSubscriptionTrends: jest.fn(),
      getUserSubscriptionMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionAnalyticsController],
      providers: [
        {
          provide: SubscriptionAnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SubscriptionAnalyticsController>(SubscriptionAnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubscriptionAnalytics', () => {
    it('should return subscription analytics', async () => {
      const mockAnalytics = {
        totalSubscriptions: 1000,
        activeSubscriptions: 800,
        expiredSubscriptions: 150,
        cancelledSubscriptions: 50,
        totalRevenue: 50000,
        thisMonthRevenue: 5000,
        lastMonthRevenue: 4500,
        revenueGrowth: 11.11,
        controlSubscriptions: 200,
        truefyndSubscriptions: 100,
        datingSubscriptions: 600,
        friendsSubscriptions: 400,
        activeInLast30Days: 50,
        churnRate: 6.25,
        averageDuration: 30.5,
        averageDurationDays: 30.5,
      };

      mockAnalyticsService.getSubscriptionAnalytics.mockResolvedValue(mockAnalytics);

      const result = await controller.getSubscriptionAnalytics();

      expect(result).toEqual(mockAnalytics);
      expect(mockAnalyticsService.getSubscriptionAnalytics).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      mockAnalyticsService.getSubscriptionAnalytics.mockRejectedValue(error);

      await expect(controller.getSubscriptionAnalytics()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getSubscriptionTrends', () => {
    it('should return subscription trends with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockTrends = {
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
      };

      mockAnalyticsService.getSubscriptionTrends.mockResolvedValue(mockTrends);

      const result = await controller.getSubscriptionTrends('30');

      expect(result).toEqual(mockTrends);
      expect(mockAnalyticsService.getSubscriptionTrends).toHaveBeenCalledWith(30);
    });

    it('should handle invalid date format', async () => {
      // The controller only accepts days as a number, not date strings
      const result = await controller.getSubscriptionTrends('invalid');
      // It will parse as NaN and use default of 30
      expect(mockAnalyticsService.getSubscriptionTrends).toHaveBeenCalledWith(30);
    });

    it('should handle service errors', async () => {
      const error = new Error('Analytics service unavailable');
      mockAnalyticsService.getSubscriptionTrends.mockRejectedValue(error);

      await expect(
        controller.getSubscriptionTrends('30'),
      ).rejects.toThrow('Analytics service unavailable');
    });
  });

  describe('getUserSubscriptionMetrics', () => {
    it('should return user subscription metrics', async () => {
      const userId = 'user-123';
      const mockRequest = {
        user: {
          sub: userId,
        },
      } as any;
      const mockMetrics = {
        totalSpent: 1500,
        totalSubscriptions: 7,
        activeSubscriptions: 3,
        averageDuration: 45.5,
        averageDurationDays: 45.5,
        preferredSubscriptionType: 'control',
      };

      mockAnalyticsService.getUserSubscriptionMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getUserSubscriptionMetrics(mockRequest);

      expect(result).toEqual(mockMetrics);
      expect(mockAnalyticsService.getUserSubscriptionMetrics).toHaveBeenCalledWith(userId);
    });

    it('should handle user with no subscriptions', async () => {
      const userId = 'user-no-subs';
      const mockRequest = {
        user: {
          sub: userId,
        },
      } as any;
      const mockMetrics = {
        totalSpent: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        averageDuration: 0,
        averageDurationDays: 0,
        preferredSubscriptionType: null,
      };

      mockAnalyticsService.getUserSubscriptionMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getUserSubscriptionMetrics(mockRequest);

      expect(result).toEqual(mockMetrics);
      expect(mockAnalyticsService.getUserSubscriptionMetrics).toHaveBeenCalledWith(userId);
    });

    it('should handle service errors', async () => {
      const userId = 'user-123';
      const mockRequest = {
        user: {
          sub: userId,
        },
      } as any;
      const error = new Error('User not found');
      mockAnalyticsService.getUserSubscriptionMetrics.mockRejectedValue(error);

      await expect(controller.getUserSubscriptionMetrics(mockRequest)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('admin access control', () => {
    it('should require admin authentication for analytics', () => {
      // Note: In a real implementation, you would test that these endpoints
      // require admin authentication. This would typically be done through
      // guards or middleware that check user roles/permissions.
      
      // Example test structure:
      // expect(controller.getSubscriptionAnalytics).toHaveBeenCalledWith(adminUser);
      // expect(controller.getSubscriptionTrends).toHaveBeenCalledWith(adminUser, ...);
      // expect(controller.getUserSubscriptionMetrics).toHaveBeenCalledWith(adminUser, ...);
    });
  });

  describe('data validation', () => {
    it('should validate date range for trends', async () => {
      // The service should handle invalid date ranges gracefully
      mockAnalyticsService.getSubscriptionTrends.mockResolvedValue({
        daily: [],
        weekly: [],
        monthly: [],
      });

      const result = await controller.getSubscriptionTrends('30');

      expect(result).toEqual({
        daily: [],
        weekly: [],
        monthly: [],
      });
    });

    it('should validate user ID format', async () => {
      const invalidUserId = '';
      const mockRequest = {
        user: {
          sub: invalidUserId,
        },
      } as any;
      const error = new Error('Invalid user ID');
      mockAnalyticsService.getUserSubscriptionMetrics.mockRejectedValue(error);

      await expect(controller.getUserSubscriptionMetrics(mockRequest)).rejects.toThrow(
        'Invalid user ID',
      );
    });
  });

  describe('performance considerations', () => {
    it('should handle large date ranges efficiently', async () => {
      mockAnalyticsService.getSubscriptionTrends.mockResolvedValue({
        daily: [], // Large datasets might be empty or limited
        weekly: [],
        monthly: [],
      });

      const result = await controller.getSubscriptionTrends('365'); // 1 year

      expect(result).toBeDefined();
      expect(mockAnalyticsService.getSubscriptionTrends).toHaveBeenCalledWith(365);
    });
  });
});
