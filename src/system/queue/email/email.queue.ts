import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailService } from 'src/system/email/email.service';
import { SendEmailCodeType } from './email.type';
import { SEND_EMAIL_CODE_JOB, SEND_EMAIL_JOB } from '../const/job';

@Processor('email')
export class EmailProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process(SEND_EMAIL_CODE_JOB)
  async handleSendEmailCode(job: Job<SendEmailCodeType>) {
    await this.emailService.sendVerificationCode(job.data.email, job.data.code);
  }

  @Process(SEND_EMAIL_JOB)
  handleSendEmail(job: Job<{ to: string; subject: string; body: string }>) {
    const { to, subject, body } = job.data;
    console.log(`📧 Sending email to ${to} | Subject: ${subject}${body}`);

    // Fake delay to simulate email sending
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`✅ Email sent to ${to}`);
  }
}
