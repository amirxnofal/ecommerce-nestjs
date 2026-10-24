import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { EmailService } from '../mail/mail.service.js';
import { SecurityService } from '../security/security.service.js';
import { RedisKeys } from '../../constants/redis-key.constant.js';
import { generateOtp } from '../../utils/otp.utils.js';
import { otpEmailTemplate } from '../mail/template/otp.template.js';

export type OtpPurpose = 'verify-email' | 'reset-password' | 'delete-account';

@Injectable()
export class OtpService {
	constructor(
		private readonly redis: RedisService,
		private readonly email: EmailService,
		private readonly security: SecurityService,
	) {}

	private readonly keys = {
		'verify-email': RedisKeys.verifyEmail,
		'reset-password': RedisKeys.resetPassword,
		'delete-account': RedisKeys.deleteAccount,
	};

	async generateAndSend(
		user: { id: string; email: string },
		purpose: OtpPurpose,
		subject: string,
	) {
		const otp = generateOtp(6);
		const hashedOtp = await this.security.hashText(otp);

		await this.redis.set({
			key: this.keys[purpose](user.id),
			value: hashedOtp,
			ttl: 5 * 60,
		});

		await this.email.sendEmail({
			to: user.email,
			subject,
			html: otpEmailTemplate(otp),
		});
	}

	async verify(
		userId: string,
		purpose: OtpPurpose,
		otp: string,
	): Promise<boolean> {
		const key = this.keys[purpose](userId);
		const hashed = await this.redis.get(key);
		if (!hashed) return false;

		const ok = await this.security.compareText(otp, hashed);
		if (ok) await this.redis.del(key);
		return ok;
	}
}
