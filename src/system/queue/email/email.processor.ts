import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { SEND_EMAIL, SEND_EMAIL_CODE } from '../queue.constant';
import { EmailService } from 'src/system/email/email.service';
import { SendEmailCodeType } from './email.type';

@Processor('email')
export class EmailProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process(SEND_EMAIL_CODE)
  async handleSendEmailCode(job: Job<SendEmailCodeType>) {
    await this.emailService.sendVerificationCode(job.data.email, job.data.code);
  }

  @Process(SEND_EMAIL)
  handleSendEmail(job: Job<{ to: string; subject: string; body: string }>) {
    const { to, subject, body } = job.data;
    console.log(`📧 Sending email to ${to} | Subject: ${subject}${body}`);

    // Fake delay to simulate email sending
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`✅ Email sent to ${to}`);
  }
}
