import {
	Body,
	Controller,
	HttpCode,
	Post,
	Req,
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
	AuthGuard,
	type AuthRequest,
} from '../../common/guard/auth/auth.guard.js';

import {
	type forgetPasswordDto,
	forgetPasswordSchema,
	type loginDto,
	loginSchema,
	type RegisterDto,
	registerSchema,
	type resendOtpDto,
	resendOtpSchema,
	type resetPasswordDto,
	resetPasswordSchema,
	type refreshDto,
	refreshSchema,
	type verifyDto,
	verifySchema,
} from './auth.validation.js';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	//* =============[ Register ]=============
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
		const user = await this.authService.register(body, file);
		return { message: 'Registered successfully', data: user };
	}

	//* =============[ Login ]=============
	@Post('login')
	@HttpCode(200)
	async login(@Body(new CustomValidationPipe(loginSchema)) body: loginDto) {
		const result = await this.authService.login(body);
		return { message: 'Login successfully', data: result };
	}

	//* =============[ Verify Email ]=============
	@Post('verify')
	@HttpCode(200)
	async verify(
		@Body(new CustomValidationPipe(verifySchema)) body: verifyDto,
	) {
		await this.authService.verify(body);
		return { message: 'Account verified' };
	}

	//* =============[ Resend OTP ]=============
	@Post('resend-otp')
	@HttpCode(200)
	async resendOtp(
		@Body(new CustomValidationPipe(resendOtpSchema)) body: resendOtpDto,
	) {
		await this.authService.resendOtp(body);
		return { message: 'OTP Sent' };
	}

	//* =============[ Forget Password ]=============
	@Post('forget')
	@HttpCode(200)
	async forgetPassword(
		@Body(new CustomValidationPipe(forgetPasswordSchema))
		body: forgetPasswordDto,
	) {
		await this.authService.forgetPassword(body);
		return { message: 'OTP Sent' };
	}

	//* =============[ Reset Password ]=============
	@Post('reset')
	@HttpCode(200)
	async resetPassword(
		@Body(new CustomValidationPipe(resetPasswordSchema))
		body: resetPasswordDto,
	) {
		await this.authService.resetPassword(body);
		return { message: 'Password reset successfully' };
	}

	//* =============[ Refresh ]=============
	@Post('refresh')
	@HttpCode(200)
	async refresh(
		@Body(new CustomValidationPipe(refreshSchema)) body: refreshDto,
	) {
		const result = await this.authService.refresh(body.refreshToken);
		return { message: 'Token refreshed', data: result };
	}

	//* =============[ Logout (current device) ]=============
	@UseGuards(AuthGuard)
	@Post('logout')
	@HttpCode(200)
	async logout(
		@Req() req: AuthRequest,
		@Body() body: { refreshToken?: string },
	) {
		await this.authService.logout(req.user!, body?.refreshToken);
		return { message: 'Logged out successfully' };
	}

	//* =============[ Logout All Devices ]=============
	@UseGuards(AuthGuard)
	@Post('logout-all')
	@HttpCode(200)
	async logoutAll(@Req() req: AuthRequest) {
		await this.authService.logoutAll(req.user!.userId);
		return { message: 'Logged out from all devices' };
	}
}
