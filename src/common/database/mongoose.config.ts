// import { MongooseModuleOptions } from '@nestjs/mongoose';

// export const mongooseConfig: MongooseModuleOptions = {
//   uri: 'mongodb://localhost:27017/your_db',
// };

// src/database/mongoose.config.ts
import type { MongooseModuleOptions } from '@nestjs/mongoose';
import type { ConfigService } from '@nestjs/config';
import type { Connection } from 'mongoose';
import { Logger } from '@nestjs/common';

const logger = new Logger('MongoDB');

export const mongooseConfigFactory = (
  configService: ConfigService,
): MongooseModuleOptions => ({
  uri: configService.get<string>('MONGO_URI'),
  connectionFactory: (connection: Connection) => {
    connection.on('connected', () => logger.log('Connected'));
    connection.on('open', () => logger.log('Connection open'));
    connection.on('disconnected', () => logger.warn('Disconnected'));
    connection.on('reconnected', () => logger.log('Reconnected'));
    connection.on('disconnecting', () => logger.log('Disconnecting'));
    return connection;
  },
});
