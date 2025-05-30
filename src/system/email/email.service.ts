// import { Injectable } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

// @Injectable()
// export class EmailService {
//   private transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   async sendVerificationCode(email: string, code: string) {
//     const html = this.buildHtmlEmail(code);
//     await this.transporter.sendMail({
//       from: '"YourApp" <no-reply@yourapp.com>',
//       to: email,
//       subject: 'Your Login Code',
//       html,
//     });
//   }

//   private buildHtmlEmail(code: string): string {
//     return `
//       <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb; color: #111827;">
//         <div style="max-width: 500px; margin: auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
//           <div style="text-align: center;">
//             <img src="https://yourapp.com/logo.png" alt="YourApp Logo" style="height: 48px; margin-bottom: 24px;" />
//             <h2 style="margin-bottom: 16px;">Your Login Code</h2>
//             <p style="font-size: 16px; margin-bottom: 24px;">
//               Use the code below to sign in to <strong>YourApp</strong>:
//             </p>
//             <div style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #2563eb; margin-bottom: 32px;">
//               ${code}
//             </div>
//             <p style="font-size: 14px; color: #6b7280;">
//               This code is valid for 10 minutes. If you didn’t request this, please ignore this email.
//             </p>
//           </div>
//         </div>
//       </div>
//     `;
//   }
// }
import { Injectable, Inject } from '@nestjs/common';
import { EmailProvider } from './interface/email-provider.interface';
import { EMAIL_PROVIDER } from './email.constants';

@Injectable()
export class EmailService {
  constructor(
    // private readonly provider: EmailProvider,
    @Inject(EMAIL_PROVIDER)
    private readonly provider: EmailProvider,
  ) {}

  async sendVerificationCode(email: string, code: string) {
    return this.provider.sendVerificationCode(email, code);
  }
}
