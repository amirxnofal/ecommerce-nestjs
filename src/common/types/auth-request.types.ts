import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import type { Types } from 'mongoose';
import type { UserRole } from '../enums/user.enum.js';

export interface DecodedToken extends JwtPayload {
	userId: string;
	role: UserRole;
	jti: string;
}

export interface AuthUser {
	userId: Types.ObjectId;
	role: UserRole;
	jti: string;
	exp?: number;
	iat?: number;
}

export type AuthRequest = Request & { user: AuthUser };
