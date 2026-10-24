import crypto from 'crypto';

export function generateOtp(length: number = 6): string {
	const min = Math.pow(10, length - 1);
	const max = Math.pow(10, length) - 1;
	const otp = crypto.randomInt(min, max + 1);
	return otp.toString();
}
