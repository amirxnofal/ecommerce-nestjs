import {
	Body,
	Controller,
	Post,
	UnsupportedMediaTypeException,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import { AuthService } from './auth.service.js';
import { CustomValidationPipe } from '../../common/pipe/validation.pipe.js';
import {
	type loginDto,
	loginSchema,
	type RegisterDto,
	registerSchema,
} from './auth.validation.js';
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	//* =============[ Register Controller ]=============
	@Post('register')
	@UseInterceptors(
		FileInterceptor('image', {
			dest: './uploads',
			fileFilter: (req, file, callback) => {
				if (!file.mimetype.match(/^image\/(png|jpeg)$/)) {
					return callback(
						new UnsupportedMediaTypeException(
							'only jpeg & png are supported',
						),
						false,
					);
				}
				callback(null, true);
			},
			limits: { fileSize: 5 * 1024 * 1024 },
		}),
	)
	async register(
		@Body(new CustomValidationPipe(registerSchema)) body: RegisterDto,
		@UploadedFile() file?: Express.Multer.File,
	) {
		const user = await this.authService.register(
			body,
			file as Express.Multer.File,
		);
		return { message: 'Registered successfully', data: user };
	}

	//* =============[ Login Controller ]=============
	@Post('login')
	async login(@Body(new CustomValidationPipe(loginSchema)) body: loginDto) {
		const user = await this.authService.login(body);
		return { message: 'Login successfully', data: user };
	}

	// @UseGuards(AuthGuard)
}
