/**
 * Interface for WebSocket notification functionality
 * This interface allows NotificationService to use WebSocket features
 * without directly depending on ChatGateway, breaking circular dependencies
 */
export interface IWebSocketNotifier {
  /**
   * Check if a user is currently connected via WebSocket
   * @param userId - The user ID to check
   * @returns Promise<boolean> - true if user is connected, false otherwise
   */
  isUserConnected(userId: string): Promise<boolean>;

  /**
   * Notify users about a new match via WebSocket
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @param chatId - Optional chat ID if chat was created
   */
  notifyNewMatch(
    userId1: string,
    userId2: string,
    chatId: string | null,
  ): Promise<void>;

  /**
   * Notify users that a chat has been archived/unmatched
   * @param chatId - The chat ID that was archived
   * @param participantIds - Array of participant user IDs to notify
   */
  notifyChatArchived(chatId: string, participantIds: string[]): Promise<void>;
}
