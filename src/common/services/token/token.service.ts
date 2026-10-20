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
import { RoleEnum } from '../../enums/role.enum.js';

export interface TokenPayload {
	userId: string | ObjectId;
	role: RoleEnum;
}

export interface DecodedToken extends JwtPayload {
	userId: string;
	role: RoleEnum;
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
		RoleEnum,
		{ access: string; refresh: string }
	> = {
		[RoleEnum.USER]: {
			access: env.userAccessSecret,
			refresh: env.userRefreshSecret,
		},
		[RoleEnum.ADMIN]: {
			access: env.adminAccessSecret,
			refresh: env.adminRefreshSecret,
		},
	};

	private getConfig(type: TokenTypeEnum, role: RoleEnum): TokenConfig {
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
		const unverified = jwt.decode(token) as { role?: RoleEnum } | null;

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
	generateAccessToken(payload: TokenPayload): string {
		return this.sign(TokenTypeEnum.ACCESS, payload).token;
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
