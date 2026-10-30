import { Injectable } from '@nestjs/common';
import { EmailProvider } from '../interface/email-provider.interface';
import sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendgridProvider implements EmailProvider {
  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY') || '');
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = this.buildHtml(code);
    await sgMail.send({
      to: email,
      from: 'no-reply@yourapp.com',
      subject: 'Your login code',
      html,
    });
  }

  private buildHtml(code: string): string {
    return `
      <div style="font-family: sans-serif; text-align: center;">
        <h2>Your Login Code</h2>
        <p>Use the code below to sign in:</p>
        <div style="font-size: 24px; font-weight: bold;">${code}</div>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
  }
}
