import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../database/model/user.model.js';
import { IUser } from '../../common/interfaces/user.interface.js';
import { UserStatus } from '../../common/enums/user.enum.js';
import { SecurityService } from '../../common/services/security/security.service.js';
import { RedisService } from '../../common/services/redis/redis.service.js';
import { TokenTypeEnum } from '../../common/enums/token.enum.js';
import type { AuthUser } from '../../common/guard/auth/auth.guard.js';
import { DeleteAccountDto, UpdateProfileDto } from './user.validation.js';
import { REFRESH_TTL_SECONDS } from '../../common/constants/auth.constant.js';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly model: Model<IUser>,
		private readonly security: SecurityService,
		private readonly redisService: RedisService,
	) {}

	private toProfile(user: IUser & { _id: unknown }) {
		return {
			id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			gender: user.gender,
			role: user.role,
			status: user.status,
			isVerified: user.isVerified,
		};
	}

	private async findActive(userId: string) {
		const user = await this.model.findById(userId);
		if (!user) throw new NotFoundException('User not found');
		if (user.status !== UserStatus.ACTIVE)
			throw new UnauthorizedException(`Account ${user.status}`);
		return user;
	}

	//* =============[ Get Me ]=============
	async getMe(userId: string) {
		const user = await this.findActive(userId);
		return this.toProfile(user);
	}

	//* =============[ Update Me ]=============
	async updateMe(
		userId: string,
		data: UpdateProfileDto,
		file?: Express.Multer.File,
	) {
		const user = await this.findActive(userId);

		if (file) {
			console.log(file.originalname);
		}
		Object.assign(user, data);
		await user.save();

		return this.toProfile(user);
	}

	//* =============[ Delete Me (soft delete) ]=============
	async deleteMe(accessToken: AuthUser, data: DeleteAccountDto) {
		const user = await this.model
			.findById(accessToken.userId)
			.select('+password');
		if (!user || user.status !== UserStatus.ACTIVE)
			throw new UnauthorizedException('Invalid credentials');

		const isMatch = await this.security.compareText(
			data.password,
			user.password,
		);
		if (!isMatch) throw new BadRequestException('Incorrect password');

		user.status = UserStatus.DELETED;
		await user.save();

		await this.redisService.revokeAllSessions(
			user._id.toString(),
			REFRESH_TTL_SECONDS,
		);
		await this.redisService.createRevokeToken(
			accessToken,
			TokenTypeEnum.ACCESS,
		);
	}
}
