import { Types } from 'mongoose';
import { TokenTypeEnum } from '../enums/token.enum.js';

export class RedisKeys {
	static verifyEmail(userId: string | Types.ObjectId): string {
		return `verify-email:${userId}`;
	}

	static resetPassword(userId: string | Types.ObjectId): string {
		return `reset-password:${userId}`;
	}

	static deleteAccount(userId: string | Types.ObjectId): string {
		return `delete-account:${userId}`;
	}

	static revokedToken(type: TokenTypeEnum, jti: string): string {
		return `revoked:${type}:${jti}`;
	}

	static socketID(userId: string | Types.ObjectId): string {
		return `userId:sockets:${userId}`;
	}

	static tokensValidFrom(userId: string | Types.ObjectId): string {
		return `tokens-valid-from:${userId}`;
	}
}
