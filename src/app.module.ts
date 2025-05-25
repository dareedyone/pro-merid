import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; //ConfigService
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
// import databaseConfig from './common/database/database';
import { mikroOrmConfigFactory } from './common/database/mikro-orm.config';

import { mongooseConfigFactory } from './common/database/mongoose.config';
import { LocationModule } from './modules/location/location.module';
import { EventModule } from './modules/event/event.module';
import { SuggestionModule } from './modules/suggestion/suggestion.module';
import { SupportModule } from './modules/support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      // load: [databaseConfig],
    }),
    // MikroOrmModule.forRoot(mikroOrmConfig[0]),
    MikroOrmModule.forRootAsync({
      useFactory: mikroOrmConfigFactory,
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      useFactory: mongooseConfigFactory,
      inject: [ConfigService],
    }),
    // MikroOrmModule.forRoot(mikroOrmConfig[1]),
    UserModule,
    AuthModule,
    ChatModule,
    LocationModule,
    EventModule,
    SuggestionModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
