# Testing Priorities - Action Plan

## 🎯 Strategic Approach

You're absolutely right to focus on **stability and testing** before adding new features. This prevents technical debt and ensures reliability.

## 📊 Current State Analysis

### Test Infrastructure ✅
- Jest configured
- 25 test files exist
- Subscription module has excellent test examples
- E2E test setup ready

### Test Coverage Assessment

#### ✅ Well-Tested Modules:
1. **Subscription** - Comprehensive (webhooks, analytics, services)
2. **Auth** - Basic tests exist
3. **Location** - Basic tests exist
4. **Support** - Basic tests exist

#### ⚠️ Needs Immediate Attention:
1. **Call Feature** - **NO TESTS** (NEW, CRITICAL)
2. **Chat Service** - Only basic "should be defined" test
3. **Dating Service** - Large service, needs thorough testing
4. **Notification System** - Basic tests, but missing batch notification tests

## 🔴 CRITICAL: Start Here

### 1. Call Feature Tests (HIGHEST PRIORITY)
**Why**: New feature, payment-related, complex logic, user-facing

**What to Test**:
```typescript
// Priority tests:
1. AgoraService.generateToken()
   - Valid token generation
   - Invalid auth ID handling
   - Provider configuration checks

2. ChatService.initiateCall()
   - Successful call initiation
   - User already in call (prevent)
   - Invalid chat access
   - Notification sending

3. ChatService.answerCall()
   - Accept call
   - Decline call
   - Already answered scenarios
   - Token generation for answering user

4. ChatService.endCall()
   - Normal termination
   - Duration calculation
   - State cleanup
```

**Test File to Create**: `src/feature/chat/services/agora.service.spec.ts`

### 2. Fix Existing TODOs
**Quick Wins**:
- [ ] Fix caller name in `chat.service.ts:1262`
- [ ] Review dating service TODOs
- [ ] Clean up commented code

## 📋 Recommended Testing Plan

### Phase 1: Critical Features (Week 1)
1. ✅ Call feature tests (create agora.service.spec.ts)
2. ✅ Expand chat.service.spec.ts with call methods
3. ✅ Integration test for call flow
4. ✅ Fix caller name TODO

### Phase 2: Business Logic (Week 2)
1. ✅ Review subscription tests (add edge cases)
2. ✅ Test matching algorithm thoroughly
3. ✅ Test notification system (batch sending)

### Phase 3: Integration (Week 3)
1. ✅ WebSocket integration tests
2. ✅ Payment flow E2E
3. ✅ User journey E2E (match → chat → call)

### Phase 4: Code Quality (Week 4)
1. ✅ Refactor large services
2. ✅ Fix all TODOs
3. ✅ Type safety improvements

## 🧪 Testing Examples

### Example: Call Feature Test Structure

```typescript
// agora.service.spec.ts
describe('AgoraService', () => {
  describe('generateToken', () => {
    it('should generate valid token for valid auth ID', async () => {});
    it('should throw error for invalid auth ID', async () => {});
    it('should convert auth ID to numeric UID correctly', async () => {});
    it('should handle missing credentials gracefully', async () => {});
  });
});

// chat.service.spec.ts (call methods)
describe('ChatService - Call Methods', () => {
  describe('initiateCall', () => {
    it('should create call successfully', async () => {});
    it('should prevent concurrent calls', async () => {});
    it('should send notifications to participants', async () => {});
    it('should handle invalid chat access', async () => {});
  });
  
  describe('answerCall', () => {
    it('should accept call successfully', async () => {});
    it('should decline call properly', async () => {});
    it('should generate token for answering user', async () => {});
  });
  
  describe('endCall', () => {
    it('should end call and calculate duration', async () => {});
    it('should update call status', async () => {});
  });
});
```

## 🎯 Quality Metrics

### Target Coverage:
- **Call Feature**: 90%+ (critical)
- **Subscription**: 95%+ (revenue)
- **Chat Service**: 85%+ (includes calls)
- **Overall**: 80%+

### Code Quality:
- Zero critical TODOs
- Zero `any` types in business logic
- All error cases handled
- Proper logging throughout

## 🚀 Immediate Actions

### Today:
1. ✅ Review this checklist
2. ⏭️ Decide on testing approach
3. ⏭️ Start with call feature tests

### This Week:
1. Create `agora.service.spec.ts`
2. Expand `chat.service.spec.ts`
3. Fix caller name TODO
4. Run coverage report

### Next Week:
1. Integration tests for calls
2. Review subscription edge cases
3. Matching algorithm tests

## 💡 Testing Best Practices (From Your Subscription Module)

Your subscription module is an excellent example! Follow these patterns:

1. **Use test factories** (like `test-setup.ts`)
2. **Mock external services** properly
3. **Test both success and error paths**
4. **Use descriptive test names**
5. **Test edge cases**

## 🔍 Code Review Focus Areas

When reviewing code, check:
- [ ] Error handling (try-catch blocks)
- [ ] Input validation (DTOs, guards)
- [ ] Security (SQL injection, XSS, auth checks)
- [ ] Performance (N+1 queries, inefficient loops)
- [ ] Logging (no console.log, use logger)
- [ ] Type safety (no unnecessary `any`)

## 📝 Notes

- **Content Module**: Can be postponed - not critical for core business
- **Focus**: Call feature is NEW and CRITICAL - test it first
- **Leverage**: Your subscription module testing patterns are excellent - use as template
- **Iterative**: Don't try to test everything at once - prioritize by business impact
