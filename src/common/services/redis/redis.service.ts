import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { env } from '../../../config/env.service.js';
import { TokenTypeEnum } from '../../enums/token.enum.js';
import { DecodedToken } from '../token/token.service.js';
import { RedisKeys } from '../../constants/redis-key.constant.js';
import { Types } from 'mongoose';

type UserId = string | Types.ObjectId;

@Injectable()
export class RedisService {
	private readonly logger = new Logger(RedisService.name);
	private client: RedisClientType;
	constructor() {
		this.client = createClient({ url: env.redisUrl });
		this.handleConnection();
		this.connection();
	}

	handleConnection() {
		this.client.on('error', (err) => {
			this.logger.error('Redis Client Error:', err);
		});

		this.client.on('ready', () => {
			this.logger.log('Connected to Redis');
		});
	}

	async connection() {
		if (!this.client.isOpen) {
			try {
				await this.client.connect();
			} catch (err) {
				this.logger.error('Redis Client Error:', err);
			}
		}
	}

	//? ----------[ Methods ]----------
	async get(key: string) {
		return await this.client.get(key);
	}

	async set({
		key,
		value,
		ttl,
	}: {
		key: string;
		value: string;
		ttl: number;
	}) {
		return await this.client.set(key, value, { EX: ttl });
	}

	async exists(key: string) {
		return await this.client.exists(key);
	}

	async del(key: string) {
		return await this.client.del(key);
	}

	//? ----------[ Token Methods ]----------
	async isTokenBlacklisted(
		jti: string,
		type: TokenTypeEnum,
	): Promise<boolean> {
		const result = await this.exists(RedisKeys.revokedToken(type, jti));
		return result === 1;
	}

	async createRevokeToken(
		decoded: Pick<DecodedToken, 'jti' | 'exp'>,
		type: TokenTypeEnum,
	) {
		if (!decoded?.jti || !decoded.exp) return null;

		const now = Math.floor(Date.now() / 1000);
		const ttl = decoded.exp - now;
		if (ttl <= 0) return null;

		await this.set({
			key: RedisKeys.revokedToken(type, decoded.jti),
			value: '1',
			ttl,
		});

		return decoded.jti;
	}

	//? ----------[ Revoke All Sessions Methods ]----------
	async revokeAllSessions(userId: UserId, ttl: number) {
		const now = Math.floor(Date.now() / 1000);
		return await this.set({
			key: RedisKeys.tokensValidFrom(userId),
			value: String(now),
			ttl,
		});
	}

	async getTokensValidFrom(userId: UserId): Promise<number | null> {
		const value = await this.get(RedisKeys.tokensValidFrom(userId));
		return value ? Number(value) : null;
	}

	async revokeTokenOnce(
		decoded: Pick<DecodedToken, 'jti' | 'exp'>,
		type: TokenTypeEnum,
	): Promise<boolean> {
		if (!decoded?.jti || !decoded.exp) return false;

		const ttl = decoded.exp - Math.floor(Date.now() / 1000);
		if (ttl <= 0) return false;

		const res = await this.client.set(
			RedisKeys.revokedToken(type, decoded.jti),
			'1',
			{ EX: ttl, NX: true },
		);
		return res === 'OK';
	}

	//? ----------[ Socket io Methods ]----------
	async addSocket(userId: UserId, socketId: string) {
		return await this.client.sAdd(RedisKeys.socketID(userId), socketId);
	}

	async removeSocket(userId: UserId, socketId: string) {
		return await this.client.sRem(RedisKeys.socketID(userId), socketId);
	}

	async getSockets(userId: UserId) {
		return await this.client.sMembers(RedisKeys.socketID(userId));
	}

	async hasSockets(userId: UserId): Promise<boolean> {
		return (await this.client.sCard(RedisKeys.socketID(userId))) > 0;
	}

	async removeUser(userId: UserId) {
		return await this.client.del(RedisKeys.socketID(userId));
	}
}
