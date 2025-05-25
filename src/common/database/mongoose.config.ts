// import { MongooseModuleOptions } from '@nestjs/mongoose';

// export const mongooseConfig: MongooseModuleOptions = {
//   uri: 'mongodb://localhost:27017/your_db',
// };

// src/database/mongoose.config.ts
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

export const mongooseConfigFactory = (
  configService: ConfigService,
): MongooseModuleOptions => ({
  uri: configService.get<string>('MONGO_URI'),
  connectionFactory: (connection: Connection) => {
    connection.on('connected', () => console.log('[MongoDB] connected'));
    connection.on('open', () => console.log('[MongoDB] open'));
    connection.on('disconnected', () => console.log('[MongoDB] disconnected'));
    connection.on('reconnected', () => console.log('[MongoDB] reconnected'));
    connection.on('disconnecting', () =>
      console.log('[MongoDB] disconnecting'),
    );
    return connection;
  },
});
