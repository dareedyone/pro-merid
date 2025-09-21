import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PushNotificationService {
  private EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotification(payload: {
    pushToken?: string;
    title: string;
    body: string;
    data?: any;
  }) {
    const { pushToken, title, body, data } = payload;
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
      console.warn('Invalid Expo token:', pushToken);
      return;
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      await axios.post(this.EXPO_PUSH_URL, message);
    } catch (error) {
      console.error('Expo push error:', error.response?.data || error.message);
    }
  }
}
