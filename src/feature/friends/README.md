# Friends Feature

This module implements the friends functionality for the Spefynd application, allowing users to send friend requests, accept/reject them, and maintain friendships.

## Architecture

The friends feature follows the same pattern as the dating feature but with friends-specific logic:

### Base Classes (Shared)
- `BaseInteraction` - Common interaction fields and methods
- `BaseMatch` - Common match fields and methods  
- `BaseInteractionService` - Common interaction service logic

### Friends-Specific Classes
- `FriendInteraction` - Extends BaseInteraction with friends-specific fields
- `FriendMatch` - Extends BaseMatch with friends-specific fields
- `FriendInteractionService` - Extends BaseInteractionService with friends-specific logic

## Features

### Friend Requests
- Send friend requests with optional messages
- Accept/reject friend requests
- View pending friend requests
- Track request status and timestamps

### Friendships
- Create matches when both users accept friend requests
- Maintain friendship metadata (level, interests, notes)
- Block/unblock friends
- Track friendship duration

### Notifications
- Friend request notifications
- Friend acceptance notifications
- Friend decline notifications

## API Endpoints

### POST /friends/request
Create a new friend request
```typescript
{
  targetUserId: string;
  friendRequestMessage?: string;
  sourceProfileId?: string;
  targetProfileId?: string;
}
```

### POST /friends/accept
Accept a friend request
```typescript
{
  interactionId: string;
  acceptanceMessage?: string;
}
```

### POST /friends/reject
Reject a friend request
```typescript
{
  interactionId: string;
  rejectionReason?: string;
  rejectionMessage?: string;
}
```

### GET /friends/requests
Get pending friend requests for the current user

### GET /friends/list
Get all friends for the current user

## Database Schema

### FriendInteraction
- Extends BaseInteraction
- Additional fields: friendRequestMessage, isAccepted, acceptedAt, acceptedBy, rejectionReason, rejectionMessage

### FriendMatch
- Extends BaseMatch
- Additional fields: friendshipLevel, mutualInterests, friendshipNotes, isBlocked, blockedAt, blockedBy, blockReason

## Key Differences from Dating

1. **No Expiry**: Friendships don't expire like dating matches
2. **Bidirectional**: Both users must accept to create a match
3. **Rich Metadata**: More detailed friendship information
4. **Blocking**: Users can block friends
5. **No Rematching**: No rematch functionality for friends

## Usage Example

```typescript
// Send friend request
const request = await friendService.createFriendRequest(authId, {
  targetUserId: 'user123',
  friendRequestMessage: 'Hey, let\'s be friends!'
});

// Accept friend request
const acceptance = await friendService.acceptFriendRequest(authId, {
  interactionId: 'interaction123',
  acceptanceMessage: 'Sure, let\'s be friends!'
});

// Get friends list
const friends = await friendService.getFriends(authId);
```

## Future Enhancements

- Friend groups/categories
- Mutual friends discovery
- Friend activity feeds
- Friend recommendations
- Friendship levels and achievements
