import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { TokenModule } from './common/services/token/token.module.js';
import { RedisModule } from './common/services/redis/redis.module.js';

@Module({
	controllers: [AppController],
	providers: [AppService],
	imports: [
		ConfigModule.forRoot({
			envFilePath: ['.env.dev', '.env.prod'],
			isGlobal: true,
		}),
		AuthModule,
		TokenModule,
		RedisModule
	],
})
export class AppModule {}
