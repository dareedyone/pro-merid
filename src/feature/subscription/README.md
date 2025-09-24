# Subscription Management System

This module handles all subscription-related functionality for the Spefynd application, including purchases, renewals, cancellations, and analytics.

## Features

### Core Subscription Management
- **Control Subscription**: Monthly premium subscription for both dating and friends
- **TrueFynd Subscription**: One-time purchase for dating only (6 months)
- **Receipt Validation**: App Store and Play Store receipt verification
- **Webhook Processing**: Real-time subscription updates from app stores
- **History Tracking**: Complete audit trail of all subscription events

### Analytics & Reporting
- **Revenue Analytics**: Total revenue, monthly growth, trends
- **Subscription Metrics**: Active, expired, cancelled subscriptions
- **User Analytics**: Individual user subscription patterns
- **Churn Analysis**: Subscription cancellation rates and patterns

## API Endpoints

### Subscription Management
```
GET    /subscription/plans?profileType=DATE|FRIEND
GET    /subscription/status?profileType=DATE|FRIEND
POST   /subscription/purchase
POST   /subscription/renew
POST   /subscription/cancel
GET    /subscription/history?profileType=DATE|FRIEND
```

### Profile-Specific Endpoints
```
GET    /dating/subscription/plans
GET    /dating/subscription/status
POST   /dating/subscription/purchase
GET    /friends/subscription/plans
GET    /friends/subscription/status
POST   /friends/subscription/purchase
```

### Webhooks
```
POST   /webhooks/app-store
POST   /webhooks/play-store
POST   /webhooks/test
```

### Analytics (Admin Only)
```
GET    /subscription/analytics
GET    /subscription/analytics/trends?days=30
GET    /subscription/analytics/user
```

## Subscription Plans

### Dating
- **Control**: $9.99/month - Full filter control, advanced matching, unlimited likes
- **TrueFynd**: $49.99/6 months - Advanced compatibility analysis, priority matching

### Friends
- **Control**: $4.99/month - Full filter control, advanced friend matching, unlimited connections

## Database Schema

### Subscription History Table
```sql
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    profile_type VARCHAR(20) NOT NULL,
    subscription_type VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    transaction_id VARCHAR(255),
    product_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(10),
    receipt_data TEXT,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

## Environment Variables

```env
# App Store Configuration
APP_STORE_SHARED_SECRET=your_shared_secret
APP_STORE_VERIFY_RECEIPT_URL=https://buy.itunes.apple.com/verifyReceipt
APP_STORE_SANDBOX_URL=https://sandbox.itunes.apple.com/verifyReceipt

# Play Store Configuration
PLAY_STORE_SERVICE_ACCOUNT_KEY=path_to_service_account_key.json
PLAY_STORE_PACKAGE_NAME=com.yourapp.package

# Webhook Security
WEBHOOK_APP_STORE_SECRET=your_webhook_secret
WEBHOOK_PLAY_STORE_SECRET=your_webhook_secret

# Feature Flags
ENABLE_RECEIPT_VALIDATION=true
ENABLE_WEBHOOK_PROCESSING=true
ENABLE_ANALYTICS=true
```

## Integration with Existing Services

### Profile Services
- **DatingService**: Uses `controlEndsAt` and `trueFyndEndsAt` fields
- **FriendsService**: Uses `controlEndsAt` field
- **Subscription checks**: Integrated into filtering and matching logic

### Chat Services
- **SubscriptionLimitsService**: Enforces subscription-based limits
- **Media permissions**: Based on subscription status
- **Message limits**: Varies by subscription type

## Usage Examples

### Purchase Subscription
```typescript
const purchaseDto = {
  profileType: ProfileType.DATE,
  subscriptionType: SubscriptionType.CONTROL,
  receiptData: 'base64_receipt_data',
  transactionId: 'transaction_123',
  productId: 'com.yourapp.control.monthly'
};

const result = await subscriptionService.purchaseSubscription(authId, purchaseDto);
```

### Check Subscription Status
```typescript
const status = await subscriptionService.getSubscriptionStatus(authId, ProfileType.DATE);
// Returns: { profileType, subscriptionType, status, isActive, expiresAt, ... }
```

### Get Analytics
```typescript
const analytics = await analyticsService.getSubscriptionAnalytics();
// Returns: { totalSubscriptions, activeSubscriptions, revenue, churnRate, ... }
```

## Security Considerations

1. **Receipt Validation**: All receipts are validated with App Store/Play Store
2. **Webhook Security**: Webhook endpoints verify signatures
3. **Admin Access**: Analytics endpoints require admin role
4. **Data Privacy**: Receipt data is stored securely and encrypted

## Monitoring & Alerts

- **Failed Receipt Validations**: Log and alert on validation failures
- **Webhook Failures**: Monitor webhook processing success rates
- **Subscription Expirations**: Track and alert on expiring subscriptions
- **Revenue Anomalies**: Monitor for unusual revenue patterns

## Future Enhancements

1. **Promotional Codes**: Support for discount codes and promotions
2. **Family Sharing**: Support for family subscription plans
3. **Enterprise Plans**: B2B subscription options
4. **Advanced Analytics**: Machine learning insights and predictions
5. **A/B Testing**: Subscription plan experimentation
