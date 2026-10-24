import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { env } from '../../../config/env.service.js';
@Injectable()
export class SecurityService {
	hashText(plainText: string): Promise<string> {
		return bcrypt.hash(plainText, env.salt);
	}

	compareText(plainText: string, cypherText: string): Promise<boolean> {
		return bcrypt.compare(plainText, cypherText);
	}
}
