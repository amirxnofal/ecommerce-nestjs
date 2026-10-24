import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from '../../services/redis/redis.service.js';
import {
	DecodedToken,
	TokenService,
} from '../../services/token/token.service.js';
import { TokenTypeEnum } from '../../enums/token.enum.js';
import { UserRole } from '../../enums/user.enum.js';

export interface AuthUser {
	userId: string;
	role: UserRole;
	jti: string;
	exp?: number;
}

export type AuthRequest = Request & { user?: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthRequest>();

		const [flag, token] = request.headers.authorization?.split(' ') ?? [];
		if (flag !== 'Bearer' || !token) {
			throw new UnauthorizedException(
				'Missing or invalid authorization header',
			);
		}

		const decoded: DecodedToken =
			this.tokenService.verifyAccessToken(token);

		const revoked = await this.redisService.isTokenBlacklisted(
			decoded.jti,
			TokenTypeEnum.ACCESS,
		);
		if (revoked) {
			throw new UnauthorizedException('Token revoked');
		}

		request.user = {
			userId: decoded.userId,
			role: decoded.role,
			jti: decoded.jti,
			exp: decoded.exp,
		};

		return true;
	}
}
