import dotenv from 'dotenv';

dotenv.config({ path: ['.env.dev', '.env.prod'] });

export const env = {
	get port() {
		return process.env.PORT;
	},
	get redisUrl() {
		return process.env.REDIS_URL as string;
	},

	get userAccessSecret() {
		return process.env.JWT_USER_ACCESS_SECRET as string;
	},
	get userRefreshSecret() {
		return process.env.JWT_USER_REFRESH_SECRET as string;
	},
	get adminAccessSecret() {
		return process.env.JWT_ADMIN_ACCESS_SECRET as string;
	},
	get adminRefreshSecret() {
		return process.env.JWT_ADMIN_REFRESH_SECRET as string;
	},
	get jwtAccessExpiry() {
		return process.env.ACCESS_EXPIRY as string;
	},
	get jwtRefreshExpiry() {
		return process.env.REFRESH_EXPIRY as string;
	},
	get appName() {
		return process.env.APP_NAME as string;
	},

	get salt() {
		return Number(process.env.SALT_ROUNDS ?? 12);
	},

	get googleAppEmail() {
		return process.env.GOOGLE_APP_EMAIL;
	},

	get googleAppPassword() {
		return process.env.GOOGLE_APP_PASSWORD;
	},
	
	get emailSenderName() {
		return process.env.EMAIL_SENDER_NAME;
	},
};
