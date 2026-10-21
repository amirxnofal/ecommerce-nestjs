import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';

@Module({
	imports: [TokenModule, RedisModule],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
