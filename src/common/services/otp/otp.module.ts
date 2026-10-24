import { Module } from '@nestjs/common';
import { EmailModule } from '../mail/mail.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { OtpService } from './otp.service.js';
import { SecurityModule } from '../security/security.module.js';

@Module({
	imports: [EmailModule, RedisModule, SecurityModule],
	providers: [OtpService],
	exports: [OtpService],
})
export class OtpModule {}
