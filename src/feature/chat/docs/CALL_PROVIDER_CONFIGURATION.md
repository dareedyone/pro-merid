# Call Provider Configuration Guide

This guide explains how to configure and switch between different call providers (Agora.io, self-hosted WebRTC, etc.) in the Spefynd calling system.

## 🏗️ Architecture Overview

The calling system uses a **Provider Factory Pattern** that allows seamless switching between different call providers without changing the core business logic.

### Provider Interface

All call providers implement the `ICallProvider` interface:

```typescript
interface ICallProvider {
  generateToken(channelName: string, userId: string, role?: string, expirationTimeInSeconds?: number): Promise<CallTokenResponse>;
  generateChannelName(chatId: string): string;
  isValidChannelName(channelName: string): boolean;
  getProviderConfig(): any;
  getProviderType(): 'agora' | 'webrtc' | 'twilio' | 'daily';
  isConfigured(): boolean;
}
```

## 🔧 Configuration Options

### 1. **Agora.io (Default - Recommended for MVP)**

**Environment Variables:**
```bash
CALL_PROVIDER=agora
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

**Pros:**
- ✅ Easy setup and configuration
- ✅ Reliable global infrastructure
- ✅ Good free tier (10,000 minutes/month)
- ✅ Excellent documentation and support

**Cons:**
- ❌ Per-minute pricing at scale
- ❌ Less control over infrastructure

**Cost:** $0.99 per 1,000 minutes after free tier

### 2. **Self-Hosted WebRTC (Cost-Effective at Scale)**

**Environment Variables:**
```bash
CALL_PROVIDER=webrtc
JWT_SECRET=your_jwt_secret_key
WEBRTC_STUN_SERVERS=["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302"]
WEBRTC_TURN_SERVERS=[{"urls":"turn:your-turn-server.com:3478","username":"user","credential":"pass"}]
```

**TURN Server Configuration:**
```bash
# Example TURN server setup (coturn)
WEBRTC_TURN_SERVERS=[
  {
    "urls": "turn:turn1.yourdomain.com:3478",
    "username": "turnuser",
    "credential": "turnpass"
  },
  {
    "urls": "turn:turn2.yourdomain.com:3478", 
    "username": "turnuser",
    "credential": "turnpass"
  }
]
```

**Pros:**
- ✅ Complete control over infrastructure
- ✅ No per-minute charges
- ✅ Customizable and extensible
- ✅ Cost-effective at scale

**Cons:**
- ❌ Complex setup and maintenance
- ❌ Need to manage TURN servers globally
- ❌ Higher initial development time

**Cost:** Infrastructure costs only (~$500-1200/month for global setup)

### 3. **Twilio Video (Enterprise Option)**

**Environment Variables:**
```bash
CALL_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
```

**Pros:**
- ✅ Enterprise-grade reliability
- ✅ Excellent global infrastructure
- ✅ Advanced features (recording, transcription)

**Cons:**
- ❌ Expensive ($0.004/minute)
- ❌ Complex pricing structure

**Cost:** $0.004 per minute

### 4. **Daily.co (Developer-Friendly)**

**Environment Variables:**
```bash
CALL_PROVIDER=daily
DAILY_API_KEY=your_daily_api_key
DAILY_BASE_URL=https://api.daily.co
```

**Pros:**
- ✅ Developer-friendly API
- ✅ Good free tier (2,000 minutes/month)
- ✅ Simple integration

**Cons:**
- ❌ Newer platform
- ❌ Limited advanced features

**Cost:** $0.0025 per minute after free tier

## 🚀 Switching Between Providers

### Method 1: Environment Variable (Recommended)

Simply change the `CALL_PROVIDER` environment variable:

```bash
# Switch to Agora
CALL_PROVIDER=agora

# Switch to self-hosted WebRTC
CALL_PROVIDER=webrtc

# Switch to Twilio
CALL_PROVIDER=twilio
```

### Method 2: Runtime Configuration

The system automatically detects which providers are configured and available:

```typescript
// Get available providers
GET /chats/calls/available-providers

// Response
{
  "agora": { "available": true, "configured": true },
  "webrtc": { "available": true, "configured": false },
  "twilio": { "available": false, "configured": false },
  "daily": { "available": false, "configured": false }
}
```

### Method 3: Fallback Strategy

The factory automatically falls back to available providers:

1. **Primary:** Uses the configured `CALL_PROVIDER`
2. **Fallback:** If primary is not configured, falls back to Agora
3. **Emergency:** If Agora is not configured, falls back to WebRTC

## 📊 Cost Comparison

| Provider | Free Tier | Paid Pricing | Break-even Point | Best For |
|----------|-----------|--------------|------------------|----------|
| **Agora.io** | 10,000 min/month | $0.99/1K min | - | MVP, Small-Medium |
| **WebRTC** | Unlimited | Infrastructure only | ~500K min/month | Large Scale |
| **Twilio** | $0.004/min | $0.004/min | Never | Enterprise |
| **Daily.co** | 2,000 min/month | $0.0025/1K min | ~200K min/month | Medium Scale |

## 🔄 Migration Strategy

### Phase 1: Start with Agora.io
```bash
CALL_PROVIDER=agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate
```

### Phase 2: Prepare Self-Hosted Infrastructure
```bash
# Set up TURN servers
# Configure WebRTC environment variables
# Test in staging environment
```

### Phase 3: Gradual Migration
```bash
# Switch to WebRTC for testing
CALL_PROVIDER=webrtc

# Monitor performance and costs
# Switch back to Agora if needed
CALL_PROVIDER=agora
```

### Phase 4: Full Migration (When Cost-Effective)
```bash
# Switch to WebRTC for production
CALL_PROVIDER=webrtc
```

## 🛠️ Implementation Details

### Adding a New Provider

1. **Create Provider Service:**
```typescript
@Injectable()
export class NewProviderService implements ICallProvider {
  // Implement all interface methods
}
```

2. **Update Factory:**
```typescript
// Add case in CallProviderFactory
case 'newprovider':
  return this.newProviderService;
```

3. **Add Environment Variables:**
```bash
NEWPROVIDER_API_KEY=your_api_key
NEWPROVIDER_SECRET=your_secret
```

### Database Compatibility

The current database schema is designed to be provider-agnostic:

```typescript
// Call entity fields work with all providers
agoraChannelName: string; // Used for all providers (kept for backward compatibility)
agoraToken: string;       // Used for all providers
agoraUid: number;         // Used for all providers
```

### Client-Side Adaptation

The client automatically adapts based on the provider configuration:

```typescript
// Get provider config from backend
const config = await fetch('/chats/calls/provider-config');

// Initialize appropriate SDK based on provider type
if (config.type === 'agora') {
  // Initialize Agora SDK
} else if (config.type === 'webrtc') {
  // Initialize WebRTC with TURN servers
}
```

## 🔍 Monitoring and Analytics

### Provider Health Check

```typescript
// Check provider status
GET /chats/calls/provider-config

// Response
{
  "type": "agora",
  "appId": "your_app_id",
  "isConfigured": true,
  "baseUrl": "https://api.agora.io"
}
```

### Call Metrics

Track these metrics to determine when to switch providers:

- **Call Volume:** Total minutes per month
- **Success Rate:** Percentage of successful calls
- **Cost per Minute:** Total cost / total minutes
- **Geographic Distribution:** Where are your users?
- **Peak Usage:** When are calls most frequent?

## 🚨 Troubleshooting

### Common Issues

1. **Provider Not Configured:**
   - Check environment variables
   - Verify credentials are correct
   - Check provider-specific documentation

2. **Fallback Not Working:**
   - Ensure at least one provider is configured
   - Check factory fallback logic
   - Verify service dependencies

3. **Client Connection Issues:**
   - Check provider configuration endpoint
   - Verify client SDK initialization
   - Check network connectivity

### Debug Endpoints

```bash
# Check available providers
GET /chats/calls/available-providers

# Check current provider config
GET /chats/calls/provider-config

# Test call initiation
POST /chats/calls/initiate
```

This architecture ensures you can easily switch between call providers based on your needs, costs, and scale requirements!

