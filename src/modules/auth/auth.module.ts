import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { TokenModule } from '../../common/services/token/token.module.js';
import { RedisModule } from '../../common/services/redis/redis.module.js';
import { OtpModule } from '../../common/services/otp/otp.module.js';
import { SecurityModule } from '../../common/services/security/security.module.js';
import { UserModel } from '../../database/model/user.model.js';

@Module({
	imports: [TokenModule, RedisModule, OtpModule, SecurityModule, UserModel],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
