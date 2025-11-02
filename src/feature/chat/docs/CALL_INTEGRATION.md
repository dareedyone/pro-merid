# Call Integration Guide - React Native/Expo

This guide explains how to integrate video and audio calling functionality in your React Native/Expo client.

## 🏗️ Backend API Overview

The backend provides a complete calling system with:
- **Agora.io integration** for WebRTC video/audio calls
- **Real-time signaling** via WebSocket
- **Push notifications** for incoming calls
- **Call history** and management
- **Subscription-based limits** (future enhancement)

## 📱 Client Integration

### 1. **Install Required Dependencies**

```bash
# Core dependencies
npm install react-native-webrtc
npm install expo-av
npm install expo-camera
npm install expo-permissions

# For development builds (if using Expo managed workflow)
npx expo install expo-dev-client
```

### 2. **Environment Configuration**

```typescript
// app.config.js
export default {
  expo: {
    // ... other config
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow Spefynd to access your camera for video calls.",
        },
      ],
      [
        "expo-av",
        {
          microphonePermission: "Allow Spefynd to access your microphone for calls.",
        },
      ],
    ],
  },
};
```

### 3. **API Endpoints**

```typescript
// Call API endpoints
const API_BASE = 'https://your-api.com/chats';

// Initiate a call
POST /chats/calls/initiate
{
  "chatId": "uuid",
  "type": "audio" | "video"
}

// Answer a call
POST /chats/calls/answer
{
  "callId": "uuid",
  "accept": true
}

// End a call
POST /chats/calls/end
{
  "callId": "uuid",
  "reason": "hung_up"
}

// Get call history
GET /chats/calls/history?profileType=DATE&page=1&limit=20

// Get active call
GET /chats/calls/active

// Get call provider configuration
GET /chats/calls/provider-config

// Get available providers
GET /chats/calls/available-providers
```

### 4. **WebSocket Events**

```typescript
// Connect to chat WebSocket
const socket = io('wss://your-api.com/chats', {
  auth: { token: userToken }
});

// Listen for call events
socket.on('call:incoming', (data) => {
  // Show incoming call UI
  showIncomingCallModal(data);
});

socket.on('call:answered', (data) => {
  // Call was answered, start WebRTC connection
  startWebRTCConnection(data);
});

socket.on('call:ended', (data) => {
  // Call ended, cleanup
  endCall();
});
```

### 5. **Call Manager Hook**

```typescript
// hooks/useCallManager.ts
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface CallData {
  id: string;
  chatId: string;
  type: 'audio' | 'video';
  agoraChannelName: string; // Channel name (provider-agnostic)
  agoraToken: string;       // Authentication token
  agoraUid: number;         // User ID in the call
  iceServers?: RTCIceServer[]; // For WebRTC provider
}

interface CallProviderConfig {
  type: 'agora' | 'webrtc' | 'twilio' | 'daily';
  appId?: string;
  baseUrl?: string;
  iceServers?: RTCIceServer[];
  isConfigured: boolean;
}

export const useCallManager = () => {
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [providerConfig, setProviderConfig] = useState<CallProviderConfig | null>(null);

  useEffect(() => {
    // Get call provider configuration
    fetchProviderConfig();
    
    // Initialize socket connection
    const newSocket = io('wss://your-api.com/chats', {
      auth: { token: userToken }
    });
    
    setSocket(newSocket);

    // Listen for call events
    newSocket.on('call:incoming', handleIncomingCall);
    newSocket.on('call:answered', handleCallAnswered);
    newSocket.on('call:ended', handleCallEnded);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchProviderConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/calls/provider-config`);
      const config = await response.json();
      setProviderConfig(config);
    } catch (error) {
      console.error('Failed to fetch provider config:', error);
    }
  };

  const initiateCall = async (chatId: string, type: 'audio' | 'video') => {
    try {
      const response = await fetch(`${API_BASE}/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ chatId, type }),
      });

      const callData = await response.json();
      setCurrentCall(callData);
      setIsInCall(true);
      
      // Start WebRTC connection
      await startWebRTCConnection(callData);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  const answerCall = async (callId: string, accept: boolean = true) => {
    try {
      const response = await fetch(`${API_BASE}/calls/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ callId, accept }),
      });

      if (accept) {
        const callData = await response.json();
        setCurrentCall(callData);
        setIsInCall(true);
        await startWebRTCConnection(callData);
      }
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const endCall = async () => {
    if (!currentCall) return;

    try {
      await fetch(`${API_BASE}/calls/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ 
          callId: currentCall.id, 
          reason: 'hung_up' 
        }),
      });

      // Cleanup WebRTC
      await cleanupWebRTC();
      
      setCurrentCall(null);
      setIsInCall(false);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  const handleIncomingCall = (data: any) => {
    // Show incoming call UI
    setCurrentCall(data);
  };

  const handleCallAnswered = (data: any) => {
    // Call was answered by other participant
    setCurrentCall(data);
    setIsInCall(true);
  };

  const handleCallEnded = () => {
    // Call ended
    setCurrentCall(null);
    setIsInCall(false);
    cleanupWebRTC();
  };

  return {
    currentCall,
    isInCall,
    providerConfig,
    initiateCall,
    answerCall,
    endCall,
  };
};
```

### 6. **Provider-Agnostic WebRTC Integration**

```typescript
// utils/webrtc.ts
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private providerConfig: CallProviderConfig | null = null;

  constructor(providerConfig: CallProviderConfig) {
    this.providerConfig = providerConfig;
  }

  async startCall(callData: CallData) {
    try {
      // Get user media
      this.localStream = await mediaDevices.getUserMedia({
        video: callData.type === 'video',
        audio: true,
      });

      // Initialize based on provider type
      if (this.providerConfig?.type === 'agora') {
        await this.initializeAgora(callData);
      } else if (this.providerConfig?.type === 'webrtc') {
        await this.initializeWebRTC(callData);
      } else {
        throw new Error(`Unsupported provider: ${this.providerConfig?.type}`);
      }

    } catch (error) {
      console.error('Failed to start call:', error);
    }
  }

  async initializeAgora(callData: CallData) {
    // Initialize Agora SDK
    const agora = require('react-native-agora');
    
    await agora.default.init(this.providerConfig?.appId);
    await agora.default.joinChannel(
      callData.agoraToken,
      callData.agoraChannelName,
      null,
      callData.agoraUid
    );
  }

  async initializeWebRTC(callData: CallData) {
    // Create peer connection with TURN servers
    this.peerConnection = new RTCPeerConnection({
      iceServers: callData.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    // Add local stream
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to other participants via WebSocket
        this.sendIceCandidate(event.candidate);
      }
    };

    // Start signaling process
    await this.startSignaling(callData);
  }

  async startSignaling(callData: CallData) {
    // Create offer
    const offer = await this.peerConnection?.createOffer();
    await this.peerConnection?.setLocalDescription(offer);

    // Send offer to other participants via WebSocket
    this.sendOffer(offer, callData);
  }

  sendOffer(offer: RTCSessionDescriptionInit, callData: CallData) {
    // Send offer via WebSocket to other participants
    // This would be handled by your WebSocket connection
    console.log('Sending offer:', offer);
  }

  sendIceCandidate(candidate: RTCIceCandidate) {
    // Send ICE candidate via WebSocket
    console.log('Sending ICE candidate:', candidate);
  }

  async cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }
}
```

### 7. **Call UI Components**

```typescript
// components/CallScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';

interface CallScreenProps {
  call: CallData;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  call,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  localStream,
  remoteStream,
}) => {
  return (
    <View style={styles.container}>
      {/* Remote video */}
      {call.type === 'video' && remoteStream && (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
        />
      )}

      {/* Local video */}
      {call.type === 'video' && localStream && (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
        />
      )}

      {/* Call controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onToggleMute}>
          <Text>Mute</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.endButton} onPress={onEndCall}>
          <Text>End Call</Text>
        </TouchableOpacity>
        
        {call.type === 'video' && (
          <TouchableOpacity style={styles.controlButton} onPress={onToggleVideo}>
            <Text>Video</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  localVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 25,
  },
  endButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 25,
  },
});
```

### 8. **Chat Integration**

```typescript
// components/ChatScreen.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useCallManager } from '../hooks/useCallManager';

export const ChatScreen = ({ chat }) => {
  const { initiateCall, isInCall } = useCallManager();

  return (
    <View>
      {/* Chat content */}
      
      {/* Call buttons */}
      {!isInCall && (
        <View style={styles.callButtons}>
          <TouchableOpacity
            onPress={() => initiateCall(chat.id, 'audio')}
            style={styles.callButton}
          >
            <Text>📞 Audio Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => initiateCall(chat.id, 'video')}
            style={styles.callButton}
          >
            <Text>📹 Video Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
```

## 🔧 Configuration

### Environment Variables

```bash
# Backend
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Client
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_WS_URL=wss://your-api.com
```

### Permissions

Add to your `app.json`:

```json
{
  "expo": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "ios.permission.CAMERA",
      "ios.permission.MICROPHONE"
    ]
  }
}
```

## 🚀 Getting Started

1. **Set up Agora.io account** and get your App ID and Certificate
2. **Configure environment variables** in your backend
3. **Install dependencies** in your React Native project
4. **Implement the call manager hook** in your app
5. **Add call UI components** to your chat screens
6. **Test with two devices** to verify functionality

## 📝 Notes

- **Development**: Use Agora's test tokens for development
- **Production**: Implement proper token generation on your backend
- **Permissions**: Request camera/microphone permissions before starting calls
- **Background**: Handle app backgrounding during calls appropriately
- **Network**: Implement proper error handling for network issues

This integration provides a complete calling system that works seamlessly with your existing chat functionality!
