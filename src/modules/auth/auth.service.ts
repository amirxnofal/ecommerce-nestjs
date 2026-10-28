import {
	BadRequestException,
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import {
	forgetPasswordDto,
	loginDto,
	RegisterDto,
	resendOtpDto,
	resetPasswordDto,
	verifyDto,
} from './auth.validation.js';
import {
	DecodedToken,
	TokenPayload,
	TokenService,
} from '../../common/services/token/token.service.js';
import {
	UserGender,
	UserProvider,
	UserRole,
	UserStatus,
} from '../../common/enums/user.enum.js';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../database/model/user.model.js';
import { Model } from 'mongoose';
import { IUser } from '../../common/interfaces/user.interface.js';
import { SecurityService } from '../../common/services/security/security.service.js';
import { OtpService } from '../../common/services/otp/otp.service.js';
import { RedisService } from '../../common/services/redis/redis.service.js';
import { RedisKeys } from '../../common/constants/redis-key.constant.js';
import { TokenTypeEnum } from '../../common/enums/token.enum.js';
import { REFRESH_TTL_SECONDS } from '../../common/constants/auth.constant.js';
import {
	OAuth2Client,
	TokenPayload as TokenPayload_Google,
} from 'google-auth-library';
import { env } from '../../config/env.service.js';

@Injectable()
export class AuthService {
	private readonly googleClient = new OAuth2Client(env.googleClientId);
	constructor(
		@InjectModel(User.name) private readonly model: Model<IUser>,
		private readonly otp: OtpService,
		private readonly security: SecurityService,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
	) {}

	//* =============[ Register ]=============
	async register(data: RegisterDto, file?: Express.Multer.File) {
		const { name, email, password, phone, gender } = data;

		const existingUser = await this.model.findOne({ email });
		if (existingUser) throw new ConflictException('Email already exists');

		const hashedPassword = await this.security.hashText(password);

		const user = await this.model.create({
			name,
			email,
			password: hashedPassword,
			phone,
			provider: UserProvider.LOCAL,
			gender:
				gender === UserGender.MALE
					? UserGender.MALE
					: UserGender.FEMALE,
			role: UserRole.USER,
			isVerified: false,
			status: UserStatus.INACTIVE,
		});
		if (!user) throw new BadRequestException('Registration failed');

		await this.otp.generateAndSend(
			user,
			'verify-email',
			'OTP Verification',
		);

		return { id: user._id, name: user.name, email: user.email };
	}

	//* =============[ Login ]=============
	async login(data: loginDto) {
		const { email, password } = data;

		const user = await this.model.findOne({ email }).select('+password');
		if (!user) throw new UnauthorizedException('Invalid credentials');

		const isMatch = await this.security.compareText(
			password,
			user.password,
		);
		if (!isMatch) throw new UnauthorizedException('Invalid credentials');

		if (!user.isVerified)
			throw new UnauthorizedException('Verify email and try again');

		if (user.status !== UserStatus.ACTIVE)
			throw new UnauthorizedException(`Account ${user.status}`);

		const payload: TokenPayload = {
			userId: user._id.toString(),
			role: user.role as UserRole,
		};

		return this.tokenService.generateTokens(payload);
	}

	//* =============[ Google Login ]=============
	async googleLogin({ idToken }: { idToken: string }) {
		if (!idToken) throw new BadRequestException('idToken is required');

		let payload: TokenPayload_Google | undefined;
		try {
			const ticket = await this.googleClient.verifyIdToken({
				idToken,
				audience: env.googleClientId,
			});
			payload = ticket.getPayload();
		} catch {
			throw new UnauthorizedException('Invalid Google token');
		}
		if (!payload?.email || !payload.email_verified)
			throw new UnauthorizedException('Google email not verified');

		let user = await this.model.findOne({ email: payload.email });

		if (!user) {
			user = await this.model.create({
				name: payload.given_name ?? payload.name,
				email: payload.email,
				provider: UserProvider.GOOGLE,
				role: UserRole.USER,
				isVerified: true,
				status: UserStatus.ACTIVE,
			});
		}

		if (user.status !== UserStatus.ACTIVE)
			throw new UnauthorizedException('Account is not active');

		return {
			...this.tokenService.generateTokens({
				userId: user._id.toString(),
				role: user.role as UserRole,
			}),
			profileComplete: !!user.phone,
		};
	}

	//* =============[ Verify Email ]=============
	async verify(data: verifyDto) {
		const { email, otp } = data;

		const user = await this.model.findOne({ email });
		if (!user) throw new BadRequestException('Email not found');

		if (user.isVerified)
			throw new UnauthorizedException('Email already verified');

		const hashedOtp = await this.redisService.get(
			RedisKeys.verifyEmail(user._id.toString()),
		);
		if (!hashedOtp) throw new BadRequestException('Invalid or expired otp');

		const isMatch = await this.security.compareText(otp, hashedOtp);
		if (!isMatch) throw new UnauthorizedException('Invalid or expired otp');

		user.isVerified = true;
		user.status = UserStatus.ACTIVE;
		await user.save();

		await this.redisService.del(RedisKeys.verifyEmail(user._id.toString()));
	}

	//* =============[ Resend OTP ]=============
	async resendOtp(data: resendOtpDto) {
		const { email } = data;

		const user = await this.model.findOne({ email });
		if (!user) throw new BadRequestException('Unable to process request');

		if (user.isVerified)
			throw new BadRequestException('Unable to process request');

		await this.otp.generateAndSend(
			user,
			'verify-email',
			'OTP Verification',
		);
	}

	//* =============[ Forget Password ]=============
	async forgetPassword(data: forgetPasswordDto) {
		const { email } = data;

		const user = await this.model.findOne({ email });
		if (!user) throw new BadRequestException('Invalid request');

		if (!user.isVerified)
			throw new BadRequestException('Please verify your email first');

		if (user.status !== UserStatus.ACTIVE)
			throw new UnauthorizedException(`Account ${user.status}`);

		await this.otp.generateAndSend(
			user,
			'reset-password',
			'Reset Password',
		);
	}

	//* =============[ Reset Password ]=============
	async resetPassword(data: resetPasswordDto) {
		const { email, otp, newPassword } = data;

		const user = await this.model.findOne({ email });
		if (!user) throw new BadRequestException('Invalid request');

		const hashedOtp = await this.redisService.get(
			RedisKeys.resetPassword(user._id.toString()),
		);
		if (!hashedOtp) throw new BadRequestException('Invalid or expired otp');

		const isMatch = await this.security.compareText(otp, hashedOtp);
		if (!isMatch) throw new UnauthorizedException('Invalid or expired otp');

		user.password = await this.security.hashText(newPassword);
		await user.save();

		await this.redisService.del(
			RedisKeys.resetPassword(user._id.toString()),
		);

		await this.redisService.revokeAllSessions(
			user._id.toString(),
			REFRESH_TTL_SECONDS,
		);
	}

	//* =============[ Refresh ]=============
	async refresh(refreshToken: string) {
		const decoded = this.tokenService.verifyRefreshToken(refreshToken);

		const validFrom = await this.redisService.getTokensValidFrom(
			decoded.userId,
		);
		if (validFrom && decoded.iat! < validFrom)
			throw new UnauthorizedException(
				'Session revoked, please login again',
			);

		const firstUse = await this.redisService.revokeTokenOnce(
			decoded,
			TokenTypeEnum.REFRESH,
		);

		if (!firstUse) {
			await this.redisService.revokeAllSessions(
				decoded.userId,
				REFRESH_TTL_SECONDS,
			);
			throw new UnauthorizedException(
				'Token reuse detected, please login again',
			);
		}

		return this.tokenService.generateTokens({
			userId: decoded.userId,
			role: decoded.role,
		});
	}

	//* =============[ Logout (current device) ]=============
	async logout(accessToken: DecodedToken, refreshToken?: string) {
		await this.redisService.createRevokeToken(
			accessToken,
			TokenTypeEnum.ACCESS,
		);

		if (refreshToken) {
			try {
				const r = this.tokenService.verifyRefreshToken(refreshToken);
				await this.redisService.createRevokeToken(
					r,
					TokenTypeEnum.REFRESH,
				);
			} catch {}
		}
	}

	//* =============[ Logout All Devices ]=============
	async logoutAll(userId: string) {
		await this.redisService.revokeAllSessions(userId, REFRESH_TTL_SECONDS);
	}
}
