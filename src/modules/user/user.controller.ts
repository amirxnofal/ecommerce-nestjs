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
import { AuthGuard } from '../../common/guard/auth/auth.guard.js';
import {
	type DeleteAccountDto,
	deleteAccountSchema,
	type UpdateProfileDto,
	updateProfileSchema,
} from './user.validation.js';
import { ResponseMessage } from '../../common/interceptors/response/response.interceptor.js';
import type { AuthRequest } from '../../common/types/auth-request.types.js';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	//* =============[ Get Me ]=============
	@Get('me')
	@ResponseMessage('Profile retrieved successfully')
	async getMe(@Req() req: AuthRequest) {
		return await this.usersService.getMe(req.user.userId);
	}

	//* =============[ Update Me ]=============
	@Patch('me')
	@ResponseMessage('Profile updated successfully')
	async updateMe(
		@Req() req: AuthRequest,
		@Body(new CustomValidationPipe(updateProfileSchema))
		body: UpdateProfileDto,
	) {
		return await this.usersService.updateMe(req.user.userId, body);
	}

	//* =============[ Delete Me ]=============
	@Delete('me')
	@HttpCode(200)
	@ResponseMessage('Account deleted successfully')
	async deleteMe(
		@Req() req: AuthRequest,
		@Body(new CustomValidationPipe(deleteAccountSchema))
		body: DeleteAccountDto,
	) {
		await this.usersService.deleteMe(req.user, body);
	}
}
