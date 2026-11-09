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
import { CTXType } from '../../interfaces/context.interface.js';
import { GqlExecutionContext } from '@nestjs/graphql';

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
		let request;

		switch (context.getType<CTXType>()) {
			case 'http':
				request = context.switchToHttp().getRequest<AuthRequest>();
				break;

			case 'graphql':
				request = GqlExecutionContext.create(context).getContext().req as AuthRequest;
				break;

			default:
				throw new UnauthorizedException('Invalid request type');
		}

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

		const validFrom = await this.redisService.getTokensValidFrom(
			decoded.userId,
		);
		if (validFrom && decoded.iat! < validFrom) {
			throw new UnauthorizedException(
				'Session revoked, please login again',
			);
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
