# Anchor Feature

The Anchor feature provides B2B whitelabel/complete solution capabilities for matchmaking platforms. It allows clients to control themes, logos, user pools, and moderation features.

## Overview

Anchors are B2B clients who can:

- Control branding and themes
- Manage isolated or mixed user pools
- Facilitate matches between their users
- Act as counselors/intermediaries in user chats
- Moderate content and interactions

## Architecture

### Core Components

1. **AnchorService** - Core anchor management (CRUD operations, configuration)
2. **AnchorUserService** - User pool management and assignment
3. **AnchorModerationService** - Chat and match moderation features
4. **AnchorIntegrationService** - Integration with existing matching and chat systems

### Key Features

#### User Pool Management

- **Isolated Mode**: Users can only see and match with users from the same anchor
- **Mixed Mode**: Users can see and match with all platform users
- **Hybrid Mode**: Custom logic based on anchor configuration

#### Branding & Customization

- Logo and color customization
- Theme selection (light/dark/custom)
- Custom CSS support
- App name customization

#### Moderation Features

- Chat monitoring and moderation
- Match facilitation and approval
- Counselor assignment
- Content filtering and reporting

## API Endpoints

### Anchor Management

```
GET    /anchors                    - List all anchors
POST   /anchors                    - Create new anchor
GET    /anchors/:id                - Get anchor details
PUT    /anchors/:id                - Update anchor
DELETE /anchors/:id                - Delete anchor
GET    /anchors/:id/config         - Get anchor configuration
PUT    /anchors/:id/config         - Update anchor configuration
```

### User Management

```
POST   /anchors/:id/users          - Add user to anchor
DELETE /anchors/:id/users          - Remove user from anchor
GET    /anchors/:id/users          - Get anchor users
GET    /anchors/:id/users/stats    - Get user statistics
```

### Moderation

```
POST   /anchors/:id/moderation/matches/facilitate     - Facilitate match
PUT    /anchors/:id/moderation/matches/:matchId/approve - Approve match
PUT    /anchors/:id/moderation/matches/:matchId/reject  - Reject match
POST   /anchors/:id/moderation/chats/moderate         - Moderate chat
POST   /anchors/:id/moderation/chats/assign-counselor - Assign counselor
GET    /anchors/:id/moderation/actions                - Get moderation actions
```

## Configuration Schema

```typescript
interface AnchorConfig {
  userPoolMode: 'isolated' | 'mixed' | 'hybrid';
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    theme: 'light' | 'dark' | 'custom';
    customCss?: string;
    favicon?: string;
    appName?: string;
  };
  features: {
    allowMatching: boolean;
    allowChatModeration: boolean;
    allowUserManagement: boolean;
    allowCustomOnboarding: boolean;
    allowBulkOperations: boolean;
    allowAnalytics: boolean;
    allowExport: boolean;
  };
  matching: {
    algorithm: 'default' | 'custom';
    customFilters?: string[];
    maxDistance?: number;
    ageRange?: { min: number; max: number };
    allowCrossAnchorMatching?: boolean;
  };
  moderation: {
    level: 'none' | 'basic' | 'advanced' | 'full';
    requireApproval: boolean;
    allowCounselorAccess: boolean;
    chatMonitoring: boolean;
    autoModeration: boolean;
    reportThreshold: number;
    allowedCounselorRoles: string[];
  };
  settings: {
    maxUsers?: number;
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    requirePhoneVerification: boolean;
    defaultLanguage: string;
    timezone: string;
  };
}
```

## Integration Points

### Matching System

The anchor feature integrates with the existing matching system through `BaseProfileService`:

```typescript
// Get users for matching based on anchor configuration
const users = await this.getAnchorAwareUsers(authId);

// Check if matching is allowed between two users
const isAllowed = await this.isMatchingAllowed(sourceUserId, targetUserId);
```

### Chat System

Anchor moderation integrates with the chat system for:

- Chat monitoring and moderation
- Counselor assignment
- Content filtering

### User Management

Users can be assigned to anchors with specific roles:

- **Owner**: Full control over anchor
- **Admin**: User management and configuration
- **Moderator**: Chat and match moderation
- **Counselor**: Chat assistance and match facilitation

## Security & Permissions

### Role Hierarchy

1. **Owner** (Level 4) - Full control
2. **Admin** (Level 3) - User management and configuration
3. **Moderator** (Level 2) - Chat and match moderation
4. **Counselor** (Level 1) - Chat assistance only

### Access Control

- All anchor operations require proper authentication
- Users can only access anchors they belong to
- Moderation actions require appropriate role permissions
- Cross-anchor operations require explicit configuration

## Database Schema

### Anchor Entity

```typescript
@Entity()
export class Anchor extends BaseTimeEntity {
  @OneToOne(() => Auth, (auth) => auth.user, { cascade: [Cascade.ALL] })
  auth!: Auth;

  @Property()
  name!: string;

  @Property()
  subdomain?: string;

  @Property({ type: 'json', nullable: true })
  config?: Record<string, any>;

  @OneToMany(() => User, (user) => user.anchor)
  users = new Collection<User>(this);

  @OneToMany(() => Auth, (auth) => auth.anchor)
  authAccounts = new Collection<Auth>(this);
}
```

### User Entity Updates

```typescript
// Added to User entity
@ManyToOne(() => Anchor, { nullable: true })
anchor?: Anchor;

@Property()
anchorRole?: AnchorRole;

@Property()
anchorJoinedAt?: Date;
```

## Testing

The anchor feature includes comprehensive test coverage:

- **Unit Tests**: Individual service methods
- **Integration Tests**: Service interactions
- **E2E Tests**: Full API workflows

Run tests with:

```bash
npm run test src/feature/anchor
```

## Future Enhancements

1. **Analytics Dashboard**: Anchor-specific analytics and reporting
2. **API Access**: RESTful API for anchor management
3. **Webhook Support**: Real-time notifications for anchor events
4. **Multi-tenancy**: Advanced tenant isolation
5. **Custom Fields**: User-defined configuration options
6. **Audit Logging**: Comprehensive activity tracking

## Error Handling

The anchor feature implements robust error handling:

- **Validation Errors**: Input validation with detailed error messages
- **Business Logic Errors**: Proper HTTP status codes and error messages
- **Database Errors**: Graceful handling of database operations
- **Permission Errors**: Clear access denied messages

## Performance Considerations

- **Caching**: Anchor configurations are cached for performance
- **Database Indexing**: Proper indexes on anchor-related queries
- **Lazy Loading**: Relationships are loaded only when needed
- **Pagination**: All list endpoints support pagination

## Monitoring & Logging

- **Structured Logging**: All operations are logged with context
- **Error Tracking**: Critical errors are tracked and monitored
- **Performance Metrics**: Key operations are measured and tracked
- **Audit Trail**: All modifications are logged for compliance
