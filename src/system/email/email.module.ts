import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendgridProvider } from './provider/sendgrid.provider';
import { NodemailerProvider } from './provider/nodemailer.provider';
import { EMAIL_PROVIDER } from './email.constants';
import { ConfigService } from '@nestjs/config';

// const useSendGrid = process.env.USE_SENDGRID === 'true';

@Module({
  providers: [
    EmailService,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService],
      //   useClass: useSendGrid ? SendgridProvider : NodemailerProvider,
      useFactory: (config: ConfigService) => {
        const useSendGrid = config.get<string>('USE_SENDGRID') === 'true';
        return useSendGrid
          ? new SendgridProvider()
          : new NodemailerProvider(config);
      },
    },
    NodemailerProvider,
    SendgridProvider,
  ],
  exports: [EmailService],
})
export class EmailModule {}
