import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  WebhookService,
  AppStoreWebhookPayload,
  PlayStoreWebhookPayload,
} from '../services/webhook-subscription.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('app-store')
  @HttpCode(HttpStatus.OK)
  async handleAppStoreWebhook(
    @Body() payload: AppStoreWebhookPayload,
    @Headers('x-apple-notification-type') notificationType?: string,
    @Headers('x-apple-signature') signature?: string,
  ): Promise<{ status: string }> {
    await this.webhookService.handleAppStoreWebhook(payload, signature);
    return { status: 'success' };
  }

  @Post('play-store')
  @HttpCode(HttpStatus.OK)
  async handlePlayStoreWebhook(
    @Body() payload: PlayStoreWebhookPayload,
    @Headers('x-goog-resource-state') resourceState?: string,
    @Headers('x-goog-signature') signature?: string,
  ): Promise<{ status: string }> {
    await this.webhookService.handlePlayStoreWebhook(payload, signature);
    return { status: 'success' };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(
    @Body() payload: any,
  ): Promise<{ status: string; received: any }> {
    return { status: 'success', received: payload };
  }
}
