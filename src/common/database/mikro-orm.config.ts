// import { defineConfig } from '@mikro-orm/core';
// import { PostgreSqlDriver } from '@mikro-orm/postgresql';
// import { MongoDriver } from '@mikro-orm/mongodb';
// import dotenv from 'dotenv';

// const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
// // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
// dotenv.config({ path: envFile });

// export default [
//   defineConfig({
//     contextName: 'postgres',
//     driver: PostgreSqlDriver,
//     dbName: process.env.DATABASE_NAME || 'default_db',
//     user: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PASSWORD,
//     host: process.env.DATABASE_HOST,
//     port: Number(process.env.DATABASE_PORT),
//     entities: ['dist/db/postgres/entities/*.js'],
//     entitiesTs: ['src/db/postgres/entities/*.ts'],
//     debug: process.env.NODE_ENV !== 'production',
//     migrations: {
//       path: 'dist/db/postgres/migrations',
//       pathTs: 'src/db/postgres/migrations',
//     },
//   }),

//   defineConfig({
//     contextName: 'mongo',
//     driver: MongoDriver,
//     clientUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/default',
//     entities: ['dist/db/mongo/entities/*.js'],
//     entitiesTs: ['src/db/mongo/entities/*.ts'],
//     debug: process.env.NODE_ENV !== 'production',
//   }),
// ];

// src/database/mikroorm.config.ts
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { User } from '../../modules/user/entities/user/user.entity';
import { Auth } from '../modules/auth/entities/auth.entity';

export const mikroOrmConfigFactory = (
  configService: ConfigService,
): MikroOrmModuleOptions => ({
  // type: 'postgresql',
  dbName: configService.get('POSTGRES_DB'),
  user: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  host: configService.get('POSTGRES_HOST'),
  port: parseInt(configService.get('POSTGRES_PORT') || '5432', 10),
  entities: [User, Auth],
  autoLoadEntities: true,
  debug: configService.get('NODE_ENV') === 'development',
  migrations: {
    path: './migrations',
    disableForeignKeys: false,
  },
});
