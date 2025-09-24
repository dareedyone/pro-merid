# Subscription Module Testing Guide

This document provides comprehensive testing guidelines and examples for the subscription module.

## Overview

The subscription module includes the following testable components:

- **Services**: `SubscriptionService`, `WebhookService`, `SubscriptionAnalyticsService`
- **Controllers**: `SubscriptionController`, `WebhookController`, `AnalyticsController`
- **Entities**: `SubscriptionHistory`
- **DTOs**: Various subscription-related DTOs

## Test Files Structure

```
src/feature/subscription/
├── services/
│   ├── subscription.service.spec.ts
│   ├── webhook-subscription.service.spec.ts
│   └── analytics-subscription.service.spec.ts
├── controllers/
│   ├── subscription.controller.spec.ts
│   ├── webhook-subscription.controller.spec.ts
│   └── analytics-subscription.controller.spec.ts
├── entities/
│   └── subscription-history.entity.spec.ts
├── subscription.module.spec.ts
├── test-setup.ts
└── README-TESTING.md
```

## Running Tests

### All Subscription Tests
```bash
npm test -- --testPathPattern=subscription
```

### Specific Test Files
```bash
# Service tests
npm test -- --testPathPattern=subscription.service.spec.ts

# Controller tests
npm test -- --testPathPattern=subscription.controller.spec.ts

# Webhook tests
npm test -- --testPathPattern=webhook-subscription.service.spec.ts

# Analytics tests
npm test -- --testPathPattern=analytics-subscription.service.spec.ts
```

### With Coverage
```bash
npm test -- --testPathPattern=subscription --coverage
```

## Test Categories

### 1. Unit Tests

#### Service Tests
- **SubscriptionService**: Core subscription logic, validation, database operations
- **WebhookService**: Webhook processing, signature verification, payload handling
- **SubscriptionAnalyticsService**: Analytics calculations, database queries, data aggregation

#### Controller Tests
- **SubscriptionController**: API endpoints, request/response handling
- **WebhookController**: Webhook endpoints, error handling
- **AnalyticsController**: Analytics endpoints, admin access control

#### Entity Tests
- **SubscriptionHistory**: Entity properties, validation, relationships

### 2. Integration Tests

#### Database Integration
- Repository operations
- Entity relationships
- Transaction handling
- Query performance

#### External Service Integration
- App Store receipt validation
- Play Store receipt validation
- Webhook signature verification

### 3. End-to-End Tests

#### Complete Subscription Flow
1. User purchases subscription
2. Receipt validation
3. Subscription activation
4. Status updates
5. Webhook processing

#### Analytics Flow
1. Data collection
2. Aggregation
3. Reporting
4. Performance metrics

## Test Data Management

### Mock Data Factories

Use the factories in `test-setup.ts`:

```typescript
import { 
  createMockUser, 
  createMockDatingProfile, 
  createMockSubscriptionHistory,
  createAppStoreWebhookPayload,
  createPurchaseSubscriptionDto 
} from './test-setup';

// Create test data
const user = createMockUser({ id: 'test-user' });
const profile = createMockDatingProfile({ user });
const subscription = createMockSubscriptionHistory({ user });
```

### Test Constants

```typescript
import { TEST_CONSTANTS } from './test-setup';

// Use predefined constants
const transactionId = TEST_CONSTANTS.TRANSACTION_ID;
const productId = TEST_CONSTANTS.PRODUCT_ID_CONTROL;
```

## Testing Patterns

### 1. Service Testing Pattern

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: any;

  beforeEach(async () => {
    mockDependency = createMockDependency();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: DependencyToken, useValue: mockDependency },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(expectedResult);
      
      // Act
      const result = await service.methodName(input);
      
      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });

    it('should handle error case', async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error('Test error'));
      
      // Act & Assert
      await expect(service.methodName(input)).rejects.toThrow('Test error');
    });
  });
});
```

### 2. Controller Testing Pattern

```typescript
describe('ControllerName', () => {
  let controller: ControllerName;
  let mockService: any;

  beforeEach(async () => {
    mockService = createMockService();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControllerName],
      providers: [
        { provide: ServiceToken, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ControllerName>(ControllerName);
  });

  describe('endpointName', () => {
    it('should return expected response', async () => {
      // Arrange
      mockService.method.mockResolvedValue(expectedResponse);
      
      // Act
      const result = await controller.endpointName(input);
      
      // Assert
      expect(result).toEqual(expectedResponse);
    });
  });
});
```

### 3. Entity Testing Pattern

```typescript
describe('EntityName', () => {
  let entity: EntityName;

  beforeEach(() => {
    entity = new EntityName();
  });

  describe('property validation', () => {
    it('should accept valid values', () => {
      entity.property = validValue;
      expect(entity.property).toBe(validValue);
    });

    it('should reject invalid values', () => {
      expect(() => {
        entity.property = invalidValue;
      }).toThrow();
    });
  });
});
```

## Test Scenarios

### 1. Subscription Service Scenarios

#### Happy Path
- ✅ User purchases subscription successfully
- ✅ Subscription renewal works
- ✅ Subscription cancellation works
- ✅ Status retrieval works

#### Error Cases
- ❌ Invalid receipt data
- ❌ Duplicate transaction
- ❌ User not found
- ❌ Invalid subscription type for profile
- ❌ Database errors

#### Edge Cases
- 🔄 Concurrent subscription updates
- 🔄 Expired subscriptions
- 🔄 Invalid product IDs
- 🔄 Missing required fields

### 2. Webhook Service Scenarios

#### App Store Webhooks
- ✅ SUBSCRIBED notification
- ✅ DID_RENEW notification
- ✅ EXPIRED notification
- ✅ REVOKE notification
- ❌ Invalid signature
- ❌ Malformed payload

#### Play Store Webhooks
- ✅ Subscription notifications
- ✅ One-time product notifications
- ✅ Different notification types
- ❌ Invalid signature
- ❌ Missing user mapping

### 3. Analytics Service Scenarios

#### Data Aggregation
- ✅ Revenue calculations
- ✅ Subscription counts
- ✅ Growth metrics
- ✅ Churn rate calculations

#### Performance
- ✅ Large dataset handling
- ✅ Query optimization
- ✅ Memory usage
- ✅ Response times

## Mocking Strategies

### 1. Repository Mocking

```typescript
const mockRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  persistAndFlush: jest.fn(),
  count: jest.fn(),
  find: jest.fn(),
};

// Setup return values
mockRepository.findOne.mockResolvedValue(mockEntity);
mockRepository.create.mockReturnValue(mockEntity);
```

### 2. External Service Mocking

```typescript
const mockExternalService = {
  validateReceipt: jest.fn(),
  processWebhook: jest.fn(),
  sendNotification: jest.fn(),
};

// Setup return values
mockExternalService.validateReceipt.mockResolvedValue(true);
```

### 3. Database Mocking

```typescript
const mockEntityManager = {
  getConnection: jest.fn().mockReturnValue({
    execute: jest.fn().mockResolvedValue([{ result: 'data' }]),
  }),
};
```

## Test Data Setup

### Environment Variables

```typescript
beforeEach(() => {
  setupTestEnvironment();
});

afterEach(() => {
  cleanupTestEnvironment();
});
```

### Database State

```typescript
beforeEach(async () => {
  // Setup test data
  await setupTestData();
});

afterEach(async () => {
  // Cleanup test data
  await cleanupTestData();
});
```

## Performance Testing

### Load Testing

```typescript
describe('Performance Tests', () => {
  it('should handle high volume webhook processing', async () => {
    const webhooks = Array(1000).fill(null).map(() => createAppStoreWebhookPayload());
    
    const startTime = Date.now();
    await Promise.all(webhooks.map(webhook => service.handleAppStoreWebhook(webhook)));
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
  });
});
```

### Memory Testing

```typescript
describe('Memory Tests', () => {
  it('should not leak memory during analytics processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Process large dataset
    await service.getSubscriptionAnalytics();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## Coverage Goals

### Service Coverage
- **SubscriptionService**: 95%+
- **WebhookService**: 90%+
- **SubscriptionAnalyticsService**: 90%+

### Controller Coverage
- **SubscriptionController**: 90%+
- **WebhookController**: 85%+
- **AnalyticsController**: 85%+

### Entity Coverage
- **SubscriptionHistory**: 100%

## Continuous Integration

### Pre-commit Hooks
```bash
# Run tests before commit
npm test -- --testPathPattern=subscription --passWithNoTests
```

### CI Pipeline
```yaml
- name: Run Subscription Tests
  run: |
    npm test -- --testPathPattern=subscription --coverage --watchAll=false
```

## Debugging Tests

### Debug Mode
```bash
npm test -- --testPathPattern=subscription --verbose --detectOpenHandles
```

### Test Debugging
```typescript
// Add debug logging
console.log('Test data:', testData);
console.log('Mock calls:', mockService.method.mock.calls);
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Reset mocks between tests
- Use factory functions for test data
- Avoid over-mocking

### 3. Assertions
- Use specific matchers
- Test both success and error cases
- Verify mock interactions

### 4. Test Data
- Use realistic test data
- Test edge cases
- Clean up after tests

## Troubleshooting

### Common Issues

1. **Mock not working**: Check if mock is properly set up and reset
2. **Async test failures**: Ensure proper async/await usage
3. **Database errors**: Verify test database setup
4. **Timeout errors**: Increase test timeout for slow operations

### Debug Commands

```bash
# Run specific test with debug output
npm test -- --testPathPattern=subscription.service.spec.ts --verbose

# Run tests with coverage
npm test -- --testPathPattern=subscription --coverage --collectCoverageFrom="src/feature/subscription/**/*.ts"

# Run tests in watch mode
npm test -- --testPathPattern=subscription --watch
```

## Future Enhancements

### Planned Test Improvements
- [ ] Integration tests with real database
- [ ] Load testing with realistic data volumes
- [ ] Security testing for webhook endpoints
- [ ] Performance benchmarking
- [ ] End-to-end testing with external services

### Test Automation
- [ ] Automated test data generation
- [ ] Test result reporting
- [ ] Performance regression detection
- [ ] Coverage trend analysis
