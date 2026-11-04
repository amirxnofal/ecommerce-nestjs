import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Patch,
	Req,
	UseGuards,
} from '@nestjs/common';
import 'multer';
import { UsersService } from './user.service.js';
import { CustomValidationPipe } from '../../common/pipe/validation.pipe.js';
import {
	AuthGuard,
	type AuthRequest,
} from '../../common/guard/auth/auth.guard.js';
import {
	type DeleteAccountDto,
	deleteAccountSchema,
	type UpdateProfileDto,
	updateProfileSchema,
} from './user.validation.js';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	//* =============[ Get Me ]=============
	@Get('me')
	async getMe(@Req() req: AuthRequest) {
		const user = await this.usersService.getMe(req.user!.userId);
		return { message: 'Profile fetched', data: user };
	}

	//* =============[ Update Me ]=============
	@Patch('me')
	async updateMe(
		@Req() req: AuthRequest,
		@Body(new CustomValidationPipe(updateProfileSchema))
		body: UpdateProfileDto,
	) {
		const user = await this.usersService.updateMe(
			req.user!.userId,
			body,
		);
		return { message: 'Profile updated', data: user };
	}

	//* =============[ Delete Me ]=============
	@Delete('me')
	@HttpCode(200)
	async deleteMe(
		@Req() req: AuthRequest,
		@Body(new CustomValidationPipe(deleteAccountSchema))
		body: DeleteAccountDto,
	) {
		await this.usersService.deleteMe(req.user!, body);
		return { message: 'Account deleted' };
	}
}
