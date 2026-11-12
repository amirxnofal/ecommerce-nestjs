import {
	Body,
	Controller,
	HttpCode,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
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
	type GoogleLoginDto,
} from './auth.validation.js';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	//* =============[ Register ]=============
	@Post('register')
	@ResponseMessage('User registered successfully')
	async register(
		@Body(new CustomValidationPipe(registerSchema)) body: RegisterDto,
	) {
		return await this.authService.register(body);
	}

	//* =============[ Email Login ]=============
	@Post('login')
	@HttpCode(200)
	@ResponseMessage('Logged in successfully')
	async login(@Body(new CustomValidationPipe(loginSchema)) body: loginDto) {
		return await this.authService.login(body);
	}

	//* =============[ Google Login ]=============
	@Post('google-login')
	@HttpCode(200)
	@ResponseMessage('Logged in with Google successfully')
	async googleLogin(@Body() body: GoogleLoginDto) {
		return await this.authService.googleLogin(body);
	}

	//* =============[ Verify Email ]=============
	@Post('verify')
	@HttpCode(200)
	@ResponseMessage('Account verified successfully')
	async verify(
		@Body(new CustomValidationPipe(verifySchema)) body: verifyDto,
	) {
		return await this.authService.verify(body);
	}

	//* =============[ Resend OTP ]=============
	@Post('resend-otp')
	@HttpCode(200)
	@ResponseMessage('OTP sent successfully')
	async resendOtp(
		@Body(new CustomValidationPipe(resendOtpSchema)) body: resendOtpDto,
	) {
		return await this.authService.resendOtp(body);
	}

	//* =============[ Forget Password ]=============
	@Post('forget')
	@HttpCode(200)
	@ResponseMessage('OTP sent successfully')
	async forgetPassword(
		@Body(new CustomValidationPipe(forgetPasswordSchema))
		body: forgetPasswordDto,
	) {
		await this.authService.forgetPassword(body);
	}

	//* =============[ Reset Password ]=============
	@Post('reset')
	@HttpCode(200)
	@ResponseMessage('Password reset successfully')
	async resetPassword(
		@Body(new CustomValidationPipe(resetPasswordSchema))
		body: resetPasswordDto,
	) {
		return await this.authService.resetPassword(body);
	}

	//* =============[ Refresh ]=============
	@Post('refresh')
	@HttpCode(200)
	@ResponseMessage('Token refreshed successfully')
	async refresh(
		@Body(new CustomValidationPipe(refreshSchema)) body: refreshDto,
	) {
		return await this.authService.refresh(body.refreshToken);
	}

	//* =============[ Logout (current device) ]=============
	@UseGuards(AuthGuard)
	@Post('logout')
	@HttpCode(200)
	@ResponseMessage('Logged out successfully')
	async logout(
		@Req() req: AuthRequest,
		@Body() body: { refreshToken?: string },
	) {
		return this.authService.logout(req.user!, body?.refreshToken);
	}

	//* =============[ Logout All Devices ]=============
	@UseGuards(AuthGuard)
	@Post('logout-all')
	@HttpCode(200)
	@ResponseMessage('Logged out from all devices successfully')
	async logoutAll(@Req() req: AuthRequest) {
		return await this.authService.logoutAll(req.user!.userId);
	}
}
