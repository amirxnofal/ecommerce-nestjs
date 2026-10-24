import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenModule } from './common/services/token/token.module.js';
import { RedisModule } from './common/services/redis/redis.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SecurityService } from './common/services/security/security.service.js';

@Module({
	controllers: [AppController],
	providers: [AppService, SecurityService],
	imports: [
		ConfigModule.forRoot({
			envFilePath: ['.env.dev', '.env.prod'],
			isGlobal: true,
		}),

		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('MONGODB_URI'),
				connectionFactory: (connection: Connection) => {
					const logger = new Logger('MongoDB');

					if (connection.readyState === 1) {
						logger.log('Connected to MongoDB');
					}

					connection.on('connected', () =>
						logger.log('Connected to MongoDB'),
					);
					connection.on('error', (err) =>
						logger.error('Connection error', err),
					);

					return connection;
				},
			}),
		}),

		AuthModule,
		TokenModule,
		RedisModule,
	],
})
export class AppModule {}
