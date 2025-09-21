import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './feature/user/user.module';
import { AuthModule } from './feature/auth/auth.module';
import { ChatModule } from './feature/chat/chat.module';
import { mikroOrmConfigFactory } from './common/database/mikro-orm.config';
import { mongooseConfigFactory } from './common/database/mongoose.config';
import { LocationModule } from './feature/location/location.module';
import { EventModule } from './feature/event/event.module';
import { SupportModule } from './feature/support/support.module';
import { QueueModule } from './system/queue/queue.module';
import { RedisCacheModule } from './system/cache/redis-cache.module';
import { TaskSchedulerModule } from './system/schedule/schedule.module';
import { DatingModule } from './feature/dating/dating.module';
import { FriendsModule } from './feature/friends/friends.module';
import { PushNotificationService } from './system/notification/push-notification.service';
import { CronModule } from './system/cron/cron.module';
import { ActivityModule } from './feature/activity/activity.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      // load: [databaseConfig],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 5,
        },
      ],
    }),
    MikroOrmModule.forRootAsync({
      useFactory: mikroOrmConfigFactory,
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      useFactory: mongooseConfigFactory,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET,
    //   signOptions: { expiresIn: '7d' },
    // }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),

    UserModule,
    AuthModule,
    ChatModule,
    LocationModule,
    EventModule,
    SupportModule,
    QueueModule,
    RedisCacheModule,
    TaskSchedulerModule,
    DatingModule,
    FriendsModule,
    CronModule,
    ActivityModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PushNotificationService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
