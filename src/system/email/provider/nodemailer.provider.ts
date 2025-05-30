import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from '../interface/email-provider.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NodemailerProvider implements EmailProvider {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: Number(this.configService.get('SMTP_PORT')),
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = this.buildHtml(code);
    await this.transporter.sendMail({
      from: '"YourApp" <no-reply@yourapp.com>',
      to: email,
      subject: 'Your login code',
      html,
    });
  }

  private buildHtml(code: string) {
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
