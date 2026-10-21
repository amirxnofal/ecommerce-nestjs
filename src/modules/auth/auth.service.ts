import { Injectable } from '@nestjs/common';
import { RegisterDto } from './auth.validation.js';
import { TokenService } from '../../common/services/token/token.service.js';
import { RoleEnum } from '../../common/enums/role.enum.js';

@Injectable()
export class AuthService {
	constructor(private readonly tokenService: TokenService) {}
	register(data: RegisterDto, file: Express.Multer.File): object {
		console.log(file);
		const token = this.tokenService.generateAccessToken({
			userId: '123123123',
			role: RoleEnum.ADMIN,
		});
		return { message: 'user registered', user: { data, file, token } };
	}
}
