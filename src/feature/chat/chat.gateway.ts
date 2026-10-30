import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import {
  NotificationService,
  NotificationType,
} from '../../system/notification/notification.service';
import { IWebSocketNotifier } from '../../common/types/interface/websocket-notifier.interface';
import { SendMessageDto } from './dto/send-message.dto';
import {
  AddReactionDto,
  RemoveReactionDto,
  ReplyToMessageDto,
} from './dto/reaction.dto';
import { ProfileType } from 'src/common/types/enums/other.enum';
import { ActivityService } from '../activity/activity.service';
import { ActivityTrackerService } from '../activity/activity-tracker.service';
import { RedisService } from '../../system/cache/redis.service';
import { ChatMessageDto } from './dto/chat-response.dto';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userProfileId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', //todo: Configure this properly for production
    credentials: true,
  },
  namespace: '/chats',
})
export class ChatGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    IWebSocketNotifier
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private disconnectionTimers = new Map<string, NodeJS.Timeout>();

  private readonly DISCONNECTION_GRACE_PERIOD = 60 * 1000;
  // Redis TTL for online status (90 seconds for auto-cleanup)
  private readonly ONLINE_STATUS_TTL = 90;
  // Real-time threshold (30 seconds)
  private readonly REALTIME_THRESHOLD = 30;
  // Away threshold (60 seconds)
  private readonly AWAY_THRESHOLD = 60;
  private readonly CONNECTED_USERS_KEY = 'connected_users';
  private readonly SERVER_ID = process.env.INSTANCE_ID || 'server1';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService,
    private readonly activityTrackerService: ActivityTrackerService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log(
      'Chat WebSocket Gateway initialized - Pure event-driven mode',
    );
    // No intervals needed - everything is event-driven + Redis TTL auto-cleanup
  }

  onModuleDestroy() {
    this.disconnectionTimers.forEach((timer) => clearTimeout(timer));
    this.disconnectionTimers.clear();
    this.logger.log('Chat WebSocket Gateway shut down');
  }

  private async _getConnectedUsers(): Promise<Record<string, number>> {
    try {
      const data = await this.redisService.get(this.CONNECTED_USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private async _saveConnectedUsers(
    users: Record<string, number>,
  ): Promise<void> {
    try {
      await this.redisService.set(
        this.CONNECTED_USERS_KEY,
        JSON.stringify(users),
        this.ONLINE_STATUS_TTL,
      );
    } catch {
      // Silent failure for connected users tracking
    }
  }

  private _isTimestampValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.ONLINE_STATUS_TTL * 1000;
  }

  private _getUserPresenceStatus(
    timestamp: number,
  ): 'online' | 'away' | 'offline' {
    const now = Date.now();
    const secondsAgo = (now - timestamp) / 1000;

    if (secondsAgo <= this.REALTIME_THRESHOLD) {
      return 'online'; // Active within 30 seconds
    } else if (secondsAgo <= this.AWAY_THRESHOLD) {
      return 'away'; // Active within 60 seconds
    } else {
      return 'offline'; // No activity > 60 seconds
    }
  }

  private _filterValidUsers(
    connectedUsers: Record<string, number>,
  ): Record<string, number> {
    const validUsers: Record<string, number> = {};
    Object.entries(connectedUsers).forEach(([userId, timestamp]) => {
      if (this._isTimestampValid(timestamp)) {
        validUsers[userId] = timestamp;
      }
    });
    return validUsers;
  }

  private async _addUserToConnectedObject(userId: string): Promise<void> {
    try {
      const connectedUsers = await this._getConnectedUsers();
      connectedUsers[userId] = Date.now();
      await this._saveConnectedUsers(connectedUsers);
    } catch {
      // Silent failure
    }
  }

  private async _removeUserFromConnectedObject(userId: string): Promise<void> {
    try {
      const connectedUsers = await this._getConnectedUsers();

      if (connectedUsers[userId]) {
        delete connectedUsers[userId];
        await this._saveConnectedUsers(connectedUsers);
      }
    } catch {
      // Silent failure
    }
  }

  private async _cleanupExpiredUsersIfNeeded(): Promise<void> {
    try {
      const connectedUsers = await this._getConnectedUsers();
      const totalUsers = Object.keys(connectedUsers).length;

      if (totalUsers < 500) return;

      const activeUsers = this._filterValidUsers(connectedUsers);
      const cleanedCount = totalUsers - Object.keys(activeUsers).length;

      if (cleanedCount > 50) {
        await this._saveConnectedUsers(activeUsers);
        this.logger.debug(`Cleaned ${cleanedCount} expired users`);
      }
    } catch {
      // Silent failure
    }
  }

  private async _updateUserActivity(userId: string): Promise<void> {
    try {
      await Promise.all([
        this._addUserToConnectedObject(userId),
        this.activityService.updateLastSeen(userId),
      ]);
    } catch {
      // Silent failure
    }
  }

  /**
   * Get online participants excluding a specific user
   */
  private async _getOnlineOtherParticipants(
    chatId: string,
    excludeUserId: string,
  ): Promise<string[]> {
    try {
      const chat = await this.chatService.getChatInternal(chatId);
      const otherParticipants = chat.participantIds.filter(
        (id) => id !== excludeUserId,
      );

      const onlineStatusMap = await this.areUsersConnected(otherParticipants);

      return otherParticipants.filter(
        (participantId) => onlineStatusMap.get(participantId) === true,
      );
    } catch {
      return [];
    }
  }

  /**
   * Emit event to online other participants in a chat
   */
  private async _emitToOnlineOthers(
    chatId: string,
    excludeUserId: string,
    eventName: string,
    payload: any,
  ): Promise<void> {
    try {
      const onlineOthers = await this._getOnlineOtherParticipants(
        chatId,
        excludeUserId,
      );

      onlineOthers.forEach((participantId) => {
        this.server.to(`user:${participantId}`).emit(eventName, payload);
      });
    } catch (error) {
      this.logger.error(
        `Emit to online others error (${eventName}):`,
        (error as Error).message,
      );
    }
  }

  private async _notifyTypingStatus(
    senderId: string,
    chatId: string,
    isTyping: boolean,
  ) {
    await this._emitToOnlineOthers(chatId, senderId, 'user_typing', {
      chatId,
      userId: senderId,
      isTyping,
    });
  }

  /**
   * Notify other participants about message read status
   */
  private async _notifyMessageRead(readerId: string, chatId: string) {
    await this._emitToOnlineOthers(chatId, readerId, 'messages_read', {
      chatId,
      userId: readerId,
      readAt: new Date(),
    });
  }

  private async _notifyUserStatusChange(userId: string, isOnline: boolean) {
    const [datingChats, friendChats] = await Promise.all([
      this.chatService.getChats(userId, ProfileType.DATE, 1, 100),
      this.chatService.getChats(userId, ProfileType.FRIEND, 1, 100),
    ]);

    const allChats = [...datingChats.chats, ...friendChats.chats];
    const participantIds = new Set<string>();

    allChats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant.id !== userId) participantIds.add(participant.id);
      });
    });

    const onlineStatusMap = await this.areUsersConnected(
      Array.from(participantIds),
    );

    for (const chat of datingChats.chats) {
      chat.participants.forEach((participant) => {
        // Only send to online participants (excluding the status changing user)
        if (
          participant.id !== userId &&
          onlineStatusMap.get(participant.id) === true
        ) {
          this.server.to(`user:${participant.id}`).emit('user_status', {
            userId,
            isOnline,
            lastSeen: new Date(),
            profileType: ProfileType.DATE,
            chatId: chat.id,
          });
        }
      });
    }

    for (const chat of friendChats.chats) {
      chat.participants.forEach((participant) => {
        if (
          participant.id !== userId &&
          onlineStatusMap.get(participant.id) === true
        ) {
          this.server.to(`user:${participant.id}`).emit('user_status', {
            userId,
            isOnline,
            lastSeen: new Date(),
            profileType: ProfileType.FRIEND,
            chatId: chat.id,
          });
        }
      });
    }
  }

  async isUserConnected(userId: string): Promise<boolean> {
    try {
      const connectedUsers = await this._getConnectedUsers();
      const userTimestamp = connectedUsers[userId];
      if (!userTimestamp) return false;

      const isValid = this._isTimestampValid(userTimestamp);

      if (!isValid) {
        await this._removeUserFromConnectedObject(userId);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async areUsersConnected(userIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    if (userIds.length === 0) return results;

    try {
      const connectedUsers = await this._getConnectedUsers();

      userIds.forEach((userId) => {
        const userTimestamp = connectedUsers[userId];
        const isOnline = userTimestamp && this._isTimestampValid(userTimestamp);
        results.set(userId, !!isOnline);
      });

      await this._cleanupExpiredUsersIfNeeded();
    } catch {
      userIds.forEach((userId) => results.set(userId, false));
    }

    return results;
  }

  async getConnectedUserIds(): Promise<string[]> {
    try {
      const connectedUsers = await this._getConnectedUsers();
      const validUsers = this._filterValidUsers(connectedUsers);
      return Object.keys(validUsers);
    } catch {
      return [];
    }
  }

  async getTotalConnectedUserCount(): Promise<number> {
    try {
      const connectedUsers = await this._getConnectedUsers();
      const validUsers = this._filterValidUsers(connectedUsers);
      return Object.keys(validUsers).length;
    } catch {
      return 0;
    }
  }

  async getUserPresenceStatus(
    userId: string,
  ): Promise<'online' | 'away' | 'offline'> {
    try {
      const connectedUsers = await this._getConnectedUsers();
      const userTimestamp = connectedUsers[userId];

      if (!userTimestamp) {
        return 'offline';
      }

      return this._getUserPresenceStatus(userTimestamp);
    } catch {
      return 'offline';
    }
  }

  async getUsersPresenceStatus(
    userIds: string[],
  ): Promise<Map<string, 'online' | 'away' | 'offline'>> {
    const results = new Map<string, 'online' | 'away' | 'offline'>();
    if (userIds.length === 0) return results;

    try {
      const connectedUsers = await this._getConnectedUsers();

      userIds.forEach((userId) => {
        const userTimestamp = connectedUsers[userId];
        if (!userTimestamp) {
          results.set(userId, 'offline');
        } else {
          results.set(userId, this._getUserPresenceStatus(userTimestamp));
        }
      });
    } catch {
      userIds.forEach((userId) => results.set(userId, 'offline'));
    }

    return results;
  }

  private async broadcastMessageToParticipants(
    chatId: string,
    message: ChatMessageDto,
  ) {
    try {
      const chat = await this.chatService.getChatInternal(chatId);

      const onlineStatusMap = await this.areUsersConnected(chat.participantIds);
      const onlineUsers: string[] = [];
      const offlineUsers: string[] = [];

      chat.participantIds.forEach((participantId) => {
        if (onlineStatusMap.get(participantId) === true) {
          onlineUsers.push(participantId);
        } else {
          offlineUsers.push(participantId);
        }
      });

      for (const userId of onlineUsers) {
        this.server.to(`user:${userId}`).emit('new_message', {
          chatId,
          message,
          metadata: {
            totalParticipants: chat.participantIds.length,
            senderId: message.senderId,
            timestamp: message.createdAt,
          },
        });
      }

      // Send push notifications to offline users only
      if (offlineUsers.length > 0) {
        await this.sendPushToOfflineUsers(offlineUsers, message, chatId);
      }

      this.logger.debug(
        `Message broadcast: ${onlineUsers.length} online (WebSocket), ${offlineUsers.length} offline (Push)`,
      );
    } catch (error) {
      this.logger.error('Broadcast message error:', (error as Error).message);
    }
  }

  private async sendPushToOfflineUsers(
    offlineUserIds: string[],
    message: any,
    chatId: string,
  ) {
    try {
      for (const userId of offlineUserIds) {
        await this.notificationService.sendPushOnly({
          userId,
          type: NotificationType.MESSAGE,
          data: {
            chatId,
            title: 'New message',
            body: 'You have a new message',
            message: 'You have a new message',
          },
        });
      }
    } catch (error) {
      this.logger.error(
        'Send push to offline users error:',
        (error as Error).message,
      );
    }
  }

  // Helper methods
  private async notifyUserOnline(userId: string) {
    await this._notifyUserStatusChange(userId, true);
  }

  private async notifyUserOffline(userId: string) {
    await this._notifyUserStatusChange(userId, false);
  }

  // Public method to send notifications from other services
  async notifyNewMatch(
    userId1: string,
    userId2: string,
    chatId: string | null,
  ) {
    this.server.to(`user:${userId1}`).emit('new_match', {
      chatId,
      matchedUserId: userId2,
      message:
        'You have a new match! Start chatting to begin your conversation.',
    });
    this.server.to(`user:${userId2}`).emit('new_match', {
      chatId,
      matchedUserId: userId1,
      message:
        'You have a new match! Start chatting to begin your conversation.',
    });
  }

  async notifyChatArchived(chatId: string, participantIds: string[]) {
    for (const participantId of participantIds) {
      this.server.to(`user:${participantId}`).emit('chat_archived', { chatId });
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token: string | undefined =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('No token provided for WebSocket connection');
        client.disconnect();
        return;
      }

      // Verify JWT token and get auth ID
      let jwtPayload: { sub: string; role: string };
      try {
        const secret = this.configService.get<string>('JWT_SECRET');
        jwtPayload = await this.jwtService.verifyAsync(token, { secret });
      } catch {
        this.logger.warn('Invalid or expired token for WebSocket connection');
        client.disconnect();
        return;
      }

      if (!jwtPayload?.sub) {
        this.logger.warn('Invalid token payload for WebSocket connection');
        client.disconnect();
        return;
      }

      // Get user using auth ID from token
      const { user } = await this.authService.fetchAuthUser(jwtPayload.sub);

      // Store user info in socket
      client.userId = user.id;
      client.userProfileId = user.datingProfile?.id || user.friendProfile?.id;

      // Cancel any existing disconnection timer for this user
      const existingTimer = this.disconnectionTimers.get(user.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.disconnectionTimers.delete(user.id);
        this.logger.debug(
          `Cancelled disconnection timer for reconnecting user ${user.id}`,
        );
      }

      // Update user activity and reset trackers
      await Promise.all([
        this._updateUserActivity(user.id),
        this.activityTrackerService.resetActivityTracker(user.id),
      ]);

      // Join user to their personal room
      await client.join(`user:${user.id}`);

      this.logger.log(`User ${user.id} connected to chat`);

      // Notify user's active chats that they're online
      await this.notifyUserOnline(user.id);
    } catch (error) {
      this.logger.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(
        `User ${client.userId} disconnected from chat - starting grace period`,
      );

      // Set grace period timer for offline detection
      const timer = setTimeout(async () => {
        // Check if user reconnected on any server during grace period
        const stillConnected = await this.isUserConnected(client.userId!);

        if (!stillConnected) {
          this.logger.log(
            `User ${client.userId} confirmed offline after grace period`,
          );

          // Remove user from connected users object and update last seen
          await Promise.all([
            this._removeUserFromConnectedObject(client.userId!),
            this.activityService.updateLastSeen(client.userId!),
            this.notifyUserOffline(client.userId!),
          ]);
        } else {
          this.logger.debug(
            `User ${client.userId} reconnected during grace period (possibly on different server)`,
          );
        }

        // Clean up timer
        this.disconnectionTimers.delete(client.userId!);
      }, this.DISCONNECTION_GRACE_PERIOD);

      // Store timer for potential cancellation
      this.disconnectionTimers.set(client.userId, timer);
    }
  }

  @SubscribeMessage('join_chat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Verify user has access to this chat
      await this.chatService.getChat(data.chatId, client.userId);

      // Join the chat room
      await client.join(`chat:${data.chatId}`);

      // Mark messages as read
      if (client.userProfileId) {
        await this.chatService.markAsRead(
          data.chatId,
          client.userId,
          client.userProfileId,
        );
      }

      // Update user activity (automatic heartbeat)
      await this._updateUserActivity(client.userId);

      client.emit('joined_chat', { chatId: data.chatId });
      this.logger.log(`User ${client.userId} joined chat ${data.chatId}`);
    } catch (error) {
      client.emit('error', { message: 'Failed to join chat' });
      this.logger.error('Join chat error:', error);
    }
  }

  @SubscribeMessage('leave_chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return;
    }

    await client.leave(`chat:${data.chatId}`);

    await this._updateUserActivity(client.userId);

    client.emit('left_chat', { chatId: data.chatId });
    this.logger.log(`User ${client.userId} left chat ${data.chatId}`);
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      try {
        // Event-driven user activity update - most efficient
        await this._updateUserActivity(client.userId);

        // Acknowledge heartbeat
        client.emit('heartbeat_ack', { timestamp: Date.now() });
      } catch {
        // Silent failure
      }
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() sendMessageDto: SendMessageDto,
  ) {
    if (!client.userId || !client.userProfileId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const message = await this.chatService.sendMessage(
        sendMessageDto,
        client.userId,
        client.userProfileId,
      );

      if (sendMessageDto.chatId) {
        await this.broadcastMessageToParticipants(
          sendMessageDto.chatId,
          message,
        );
      }

      await this._updateUserActivity(client.userId);

      this.logger.log(
        `Message sent in chat ${sendMessageDto.chatId} by user ${client.userId}`,
      );
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
      this.logger.error('Send message error:', error);
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return;
    }

    await this._updateUserActivity(client.userId);
    await this._notifyTypingStatus(client.userId, data.chatId, true);
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId) {
      return;
    }
    await this._notifyTypingStatus(client.userId, data.chatId, false);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (!client.userId || !client.userProfileId) {
      return;
    }

    try {
      await this.chatService.markAsRead(
        data.chatId,
        client.userId,
        client.userProfileId,
      );

      await this._notifyMessageRead(client.userId, data.chatId);
    } catch (error) {
      this.logger.error('Mark read error:', error);
    }
  }

  // Reaction WebSocket events
  @SubscribeMessage('add_reaction')
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() addReactionDto: AddReactionDto,
  ) {
    if (!client.userId || !client.userProfileId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // TODO: Get from user's subscription
      const isPremium = false;
      const isTrueFynd = false;

      const reaction = await this.chatService.addReaction(
        addReactionDto,
        client.userId,
        client.userProfileId,
        isPremium,
        isTrueFynd,
      );

      await this._emitToOnlineOthers(
        addReactionDto.chatId,
        client.userId,
        'reaction_added',
        {
          messageId: addReactionDto.messageId,
          reaction,
          chatId: addReactionDto.chatId,
        },
      );

      this.logger.log(
        `Reaction added to message ${addReactionDto.messageId} by user ${client.userId}`,
      );
    } catch (error) {
      client.emit('error', { message: 'Failed to add reaction' });
      this.logger.error('Add reaction error:', error);
    }
  }

  @SubscribeMessage('remove_reaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() removeReactionDto: RemoveReactionDto,
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      await this.chatService.removeReaction(removeReactionDto, client.userId);

      await this._emitToOnlineOthers(
        removeReactionDto.chatId,
        client.userId,
        'reaction_removed',
        {
          messageId: removeReactionDto.messageId,
          emoji: removeReactionDto.emoji,
          userId: client.userId,
          chatId: removeReactionDto.chatId,
        },
      );

      this.logger.log(
        `Reaction removed from message ${removeReactionDto.messageId} by user ${client.userId}`,
      );
    } catch (error) {
      client.emit('error', { message: 'Failed to remove reaction' });
      this.logger.error('Remove reaction error:', error);
    }
  }

  @SubscribeMessage('reply_to_message')
  async handleReplyToMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() replyDto: ReplyToMessageDto,
  ) {
    if (!client.userId || !client.userProfileId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const isPremium = false;
      const isTrueFynd = false;

      const reply = await this.chatService.replyToMessage(
        replyDto,
        client.userId,
        client.userProfileId,
        isPremium,
        isTrueFynd,
      );

      await this._emitToOnlineOthers(
        replyDto.chatId,
        client.userId,
        'message_replied',
        {
          originalMessageId: replyDto.messageId,
          reply,
          chatId: replyDto.chatId,
        },
      );

      this.logger.log(
        `Reply sent to message ${replyDto.messageId} by user ${client.userId}`,
      );
    } catch (error) {
      client.emit('error', { message: 'Failed to send reply' });
      this.logger.error('Reply to message error:', error);
    }
  }
}
