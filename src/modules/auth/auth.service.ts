import {
	BadRequestException,
	ConflictException,
	Injectable,
} from '@nestjs/common';
import { RegisterDto } from './auth.validation.js';
import { TokenService } from '../../common/services/token/token.service.js';
import {
	UserGender,
	UserProvider,
	UserRole,
} from '../../common/enums/user.enum.js';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../database/model/user.model.js';
import { Model } from 'mongoose';
import { IUser } from '../../common/interfaces/user.interface.js';
import { SecurityService } from '../../common/services/security/security.service.js';
import { OtpService } from '../../common/services/otp/otp.service.js';

@Injectable()
export class AuthService {
	constructor(
		@InjectModel(User.name) private readonly model: Model<IUser>,
		private readonly otp: OtpService,
		private readonly security: SecurityService,
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
}
