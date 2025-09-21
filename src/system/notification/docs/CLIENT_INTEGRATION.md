# Client-Side Push Notification Integration

## How the Efficient Notification Strategy Works

### Backend Strategy:
1. **Always send push notification** with rich data payload
2. **Always try WebSocket** for active users
3. **Client handles app state** and decides what to do

### Client-Side Implementation (React Native/Expo):

```typescript
// App.tsx or notification handler
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { data } = notification.request.content;
    const appState = AppState.currentState;

    if (appState === 'active') {
      // App is open - update UI directly, don't show notification
      handleAppActiveNotification(data);
      return { shouldShowAlert: false, shouldPlaySound: false };
    } else {
      // App is closed/background - show notification
      return { shouldShowAlert: true, shouldPlaySound: true };
    }
  },
});

// Handle notifications when app is active
function handleAppActiveNotification(data: any) {
  switch (data.type) {
    case 'match':
      // Update matches list, show in-app notification
      updateMatchesList();
      showInAppNotification('New Match! 🎉');
      break;
      
    case 'message':
      // Update chat list, show message preview
      updateChatList();
      showMessagePreview(data.senderName, data.message);
      break;
      
    case 'unmatch':
      // Remove from matches, show toast
      removeFromMatches(data.matchedUserId);
      showToast('Match expired');
      break;
  }
}

// Listen for app state changes
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App became active - check for pending notifications
      checkPendingNotifications();
    }
  });

  return () => subscription?.remove();
}, []);
```

### Push Notification Payload Structure:

```typescript
// Match notification
{
  title: "New Match! 🎉",
  body: "You have a new match! Start chatting...",
  data: {
    type: 'match',
    matchedUserId: 'uuid',
    chatId: 'uuid',
    action: 'open_chat',
    priority: 'high'
  }
}

// Message notification  
{
  title: "New message from John",
  body: "Hey, how are you?",
  data: {
    type: 'message',
    chatId: 'uuid',
    senderId: 'uuid',
    action: 'open_chat',
    priority: 'normal'
  }
}
```

### Benefits of This Approach:

1. **Efficient**: No server-side app state tracking needed
2. **Reliable**: Client always gets the notification
3. **Smart**: Client decides whether to show notification or update UI
4. **Simple**: Backend just sends push notification with rich data
5. **Battery Friendly**: No constant server polling for app state

### Backend Implementation:

```typescript
// Always send both WebSocket and Push
await this.sendWebSocketNotification(context); // For active users
await this.sendPushNotification(context);      // For all users

// Client handles the rest!
```

This approach leverages Expo's built-in app state detection and gives you the best of both worlds: instant updates for active users and reliable notifications for inactive users.
