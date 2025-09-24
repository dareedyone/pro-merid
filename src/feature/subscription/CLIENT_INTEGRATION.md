# Client Integration Guide - Subscription & Payments

This guide explains how the React Native/Expo client should interact with the backend for subscription and payment functionality.

## 🏗️ Backend Architecture Overview

The backend provides a complete subscription management system with:
- **Receipt validation** for App Store and Play Store
- **Webhook processing** for real-time subscription updates
- **Subscription status tracking** with expiration handling
- **Analytics and reporting** for business insights
- **Profile-specific subscriptions** (dating vs friends)

## 📱 Client Integration Flow

### 1. **Get Available Subscription Plans**

```typescript
// Get plans for dating profile
GET /dating/subscription/plans

// Get plans for friends profile  
GET /friends/subscription/plans

// Response
{
  "plans": [
    {
      "type": "control",
      "name": "Control",
      "description": "Premium monthly subscription with full filter control",
      "price": 9.99,
      "currency": "USD",
      "duration": 30,
      "features": ["Full filter control", "Advanced matching", "Unlimited likes"],
      "isAvailable": true
    }
  ]
}
```

### 2. **Check Current Subscription Status**

```typescript
// Check dating subscription status
GET /dating/subscription/status

// Check friends subscription status
GET /friends/subscription/status

// Response
{
  "profileType": "DATE",
  "subscriptionType": "control",
  "status": "active",
  "isActive": true,
  "expiresAt": "2024-02-15T10:30:00Z",
  "purchasedAt": "2024-01-15T10:30:00Z",
  "autoRenew": true
}
```

### 3. **Purchase Subscription (Mobile Flow)**

```typescript
// Step 1: Initiate purchase with mobile payment library
import { requestPurchase, getProducts } from 'react-native-iap';

// Get available products from App Store/Play Store
const products = await getProducts({
  skus: ['com.spefynd.control.monthly', 'com.spefynd.truefynd.6months']
});

// Step 2: Request purchase
const purchase = await requestPurchase({
  sku: 'com.spefynd.control.monthly',
  // ... other options
});

// Step 3: Send receipt to backend for validation
const response = await fetch('/dating/subscription/purchase', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscriptionType: 'control',
    receiptData: purchase.transactionReceipt, // Base64 encoded receipt
    transactionId: purchase.transactionId,
    productId: purchase.productId
  })
});

// Step 4: Handle response
const subscriptionStatus = await response.json();
if (subscriptionStatus.isActive) {
  // Show success, unlock premium features
  showSuccessMessage('Subscription activated!');
  updateUIForPremiumUser();
}
```

### 4. **Handle Subscription Renewals**

```typescript
// Listen for subscription updates
import { purchaseUpdatedListener } from 'react-native-iap';

const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
  if (purchase.transactionState === 'purchased') {
    // Send renewal to backend
    await fetch('/dating/subscription/renew', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionType: 'control',
        receiptData: purchase.transactionReceipt,
        transactionId: purchase.transactionId
      })
    });
  }
});
```

### 5. **Cancel Subscription**

```typescript
// Cancel subscription (this expires it immediately)
const response = await fetch('/dating/subscription/cancel', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subscriptionType: 'control',
    reason: 'User requested cancellation'
  })
});

// Note: For actual cancellation (preventing auto-renewal), 
// user must do this through App Store/Play Store settings
```

### 6. **Get Subscription History**

```typescript
// Get user's subscription history
const response = await fetch('/dating/subscription/history', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const history = await response.json();
// Shows all past purchases, renewals, cancellations
```

## 🔄 Real-time Updates (Webhooks)

The backend automatically processes webhook notifications from App Store/Play Store:

```typescript
// Backend handles these automatically:
// - Subscription renewals
// - Subscription cancellations  
// - Subscription expirations
// - Refunds

// Client should periodically check status or use push notifications
// to inform user of subscription changes
```

## 🛡️ Error Handling

```typescript
try {
  const response = await fetch('/dating/subscription/purchase', {
    method: 'POST',
    body: JSON.stringify(purchaseData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const result = await response.json();
  return result;
  
} catch (error) {
  if (error.message.includes('Invalid receipt')) {
    showError('Payment verification failed. Please try again.');
  } else if (error.message.includes('subscription already active')) {
    showError('You already have an active subscription.');
  } else {
    showError('Purchase failed. Please try again.');
  }
}
```

## 📊 Subscription Status Checking

```typescript
// Check subscription status before premium actions
async function checkSubscriptionStatus() {
  const response = await fetch('/dating/subscription/status');
  const status = await response.json();
  
  if (status.isActive) {
    // User has active subscription - allow premium features
    return true;
  } else {
    // User doesn't have subscription - show upgrade prompt
    showUpgradePrompt();
    return false;
  }
}

// Use before premium actions
async function sendMessage() {
  const hasSubscription = await checkSubscriptionStatus();
  if (!hasSubscription) return;
  
  // Proceed with sending message
  // ... message sending logic
}
```

## 🎯 Product IDs Setup

### App Store Product IDs
```
com.spefynd.dating.control.monthly     // Dating Control - Monthly
com.spefynd.dating.truefynd.6months    // Dating TrueFynd - 6 Months
com.spefynd.friends.control.monthly    // Friends Control - Monthly
```

### Play Store Product IDs
```
dating_control_monthly                  // Dating Control - Monthly
dating_truefynd_6months                 // Dating TrueFynd - 6 Months
friends_control_monthly                 // Friends Control - Monthly
```

## 🔧 Environment Configuration

```typescript
// Client environment setup
const config = {
  appStore: {
    sharedSecret: 'your_shared_secret',
    bundleId: 'com.spefynd.app'
  },
  playStore: {
    packageName: 'com.spefynd.app',
    serviceAccountEmail: 'your-service-account@project.iam.gserviceaccount.com'
  },
  backend: {
    baseUrl: 'https://api.spefynd.com',
    webhookUrl: 'https://api.spefynd.com/webhooks'
  }
};
```

## 📱 Complete Integration Example

```typescript
import { 
  initConnection, 
  getProducts, 
  requestPurchase, 
  purchaseUpdatedListener,
  finishTransaction 
} from 'react-native-iap';

class SubscriptionManager {
  async initialize() {
    try {
      await initConnection();
      
      // Set up purchase listener
      purchaseUpdatedListener(async (purchase) => {
        if (purchase.transactionState === 'purchased') {
          await this.handlePurchase(purchase);
          await finishTransaction(purchase);
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
    }
  }
  
  async getAvailablePlans(profileType: 'DATE' | 'FRIEND') {
    const response = await fetch(`/${profileType.toLowerCase()}/subscription/plans`);
    return response.json();
  }
  
  async purchaseSubscription(profileType: 'DATE' | 'FRIEND', planType: 'control' | 'truefynd') {
    try {
      // Get products from store
      const products = await getProducts({
        skus: [`${profileType.toLowerCase()}_${planType}_monthly`]
      });
      
      if (products.length === 0) {
        throw new Error('Product not available');
      }
      
      // Request purchase
      const purchase = await requestPurchase({
        sku: products[0].productId
      });
      
      return purchase;
      
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }
  
  async handlePurchase(purchase: any) {
    try {
      const response = await fetch('/dating/subscription/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionType: 'control',
          receiptData: purchase.transactionReceipt,
          transactionId: purchase.transactionId,
          productId: purchase.productId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        this.onSubscriptionUpdated(result);
      } else {
        throw new Error('Backend validation failed');
      }
      
    } catch (error) {
      console.error('Failed to validate purchase:', error);
      throw error;
    }
  }
  
  onSubscriptionUpdated(subscription: any) {
    if (subscription.isActive) {
      // Unlock premium features
      this.unlockPremiumFeatures();
      showSuccessMessage('Subscription activated!');
    }
  }
  
  unlockPremiumFeatures() {
    // Update UI to show premium features
    // Enable advanced filters
    // Remove limitations
  }
}

// Usage
const subscriptionManager = new SubscriptionManager();
await subscriptionManager.initialize();
```

## 🚀 Key Benefits

1. **Complete Backend Support**: All subscription logic handled server-side
2. **Real-time Updates**: Webhooks keep subscriptions in sync
3. **Secure Validation**: Receipt validation prevents fraud
4. **Profile-Specific**: Different plans for dating vs friends
5. **Analytics Ready**: Complete tracking and reporting
6. **Error Handling**: Comprehensive error management
7. **Scalable**: Built to handle high volume of transactions

The backend is **production-ready** for App Store and Play Store payments! 🎉
