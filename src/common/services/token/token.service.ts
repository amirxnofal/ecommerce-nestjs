import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { ObjectId } from 'mongoose';
import { TokenTypeEnum } from '../../enums/token.enum.js';
import { env } from '../../../config/env.service.js';
import { UserRole } from '../../enums/user.enum.js';

export interface TokenPayload {
	userId: string | ObjectId;
	role: UserRole;
}

export interface DecodedToken extends JwtPayload {
	userId: string;
	role: UserRole;
	jti: string;
}

interface TokenConfig {
	secret: string;
	expiresIn: string;
	audience: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
	private readonly secrets: Record<
		UserRole,
		{ access: string; refresh: string }
	> = {
		[UserRole.USER]: {
			access: env.userAccessSecret,
			refresh: env.userRefreshSecret,
		},
		[UserRole.ADMIN]: {
			access: env.adminAccessSecret,
			refresh: env.adminRefreshSecret,
		},
	};

	private getConfig(type: TokenTypeEnum, role: UserRole): TokenConfig {
		const roleSecrets = this.secrets[role];
		if (!roleSecrets) {
			throw new BadRequestException(`Invalid role: ${role}`);
		}

		return type === TokenTypeEnum.ACCESS
			? {
					secret: roleSecrets.access,
					expiresIn: env.jwtAccessExpiry as string,
					audience: 'access',
				}
			: {
					secret: roleSecrets.refresh,
					expiresIn: env.jwtRefreshExpiry as string,
					audience: 'refresh',
				};
	}

	private sign(type: TokenTypeEnum, { userId, role }: TokenPayload) {
		const { secret, expiresIn, audience } = this.getConfig(type, role);
		const jti = randomUUID();

		const options: SignOptions = {
			algorithm: 'HS256',
			expiresIn: expiresIn as SignOptions['expiresIn'],
			issuer: env.appName,
			audience,
			jwtid: jti,
		};

		const token = jwt.sign(
			{ userId: userId.toString(), role },
			secret,
			options,
		);
		const { exp, iat } = jwt.decode(token) as { exp: number; iat: number };

		return { token, jti, ttlSeconds: exp - iat };
	}

	private verify(type: TokenTypeEnum, token: string): DecodedToken {
		const unverified = jwt.decode(token) as { role?: UserRole } | null;

		if (
			!unverified?.role ||
			!Object.hasOwn(this.secrets, unverified.role)
		) {
			throw new UnauthorizedException('Invalid token');
		}

		const { secret, audience } = this.getConfig(type, unverified.role);

		let decoded: DecodedToken;
		try {
			decoded = jwt.verify(token, secret, {
				algorithms: ['HS256'],
				issuer: env.appName,
				audience,
			}) as DecodedToken;
		} catch (e) {
			if (e instanceof jwt.TokenExpiredError) {
				throw new UnauthorizedException('Token expired');
			}
			throw new UnauthorizedException('Invalid token');
		}

		return decoded;
	}

	// ---------- Access ----------
	generateAccessToken(payload: TokenPayload): {
		accessToken: string;
		refreshToken: string;
	} {
		const accessToken = this.sign(TokenTypeEnum.ACCESS, payload).token;
		const refreshToken = this.sign(TokenTypeEnum.REFRESH, payload).token;
		return { accessToken, refreshToken };
	}

	verifyAccessToken(token: string): DecodedToken {
		return this.verify(TokenTypeEnum.ACCESS, token);
	}

	// ---------- Refresh ----------
	generateRefreshToken(payload: TokenPayload) {
		return this.sign(TokenTypeEnum.REFRESH, payload);
	}

	verifyRefreshToken(token: string): DecodedToken {
		return this.verify(TokenTypeEnum.REFRESH, token);
	}
}
