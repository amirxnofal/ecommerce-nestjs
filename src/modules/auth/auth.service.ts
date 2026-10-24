import {
	BadRequestException,
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import {
	loginDto,
	RegisterDto,
	resendOtpDto,
	verifyDto,
} from './auth.validation.js';
import {
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

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(User.name) private readonly model: Model<IUser>,
		private readonly otp: OtpService,
		private readonly security: SecurityService,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
	) {}

	async register(data: RegisterDto, file: Express.Multer.File): Promise<any> {
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
		if (file) {
			console.log(file.originalname);
		}

		return user;
	}

	async login(data: loginDto) {
		const { email, password } = data;

		const user = await this.model.findOne({ email }).select('+password');

		if (!user) throw new BadRequestException('Invalid credentials');

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
		const tokens = this.tokenService.generateTokens(payload);

		return tokens;
	}

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

		return;
	}

	async resendOtp(data: resendOtpDto) {
		const { email } = data;

		const user = await this.model.findOne({ email });

		if (!user) throw new BadRequestException('Unable to process request');

		await this.otp.generateAndSend(
			user,
			'verify-email',
			'OTP Verification',
		);

		return;
	}
}
