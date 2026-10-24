import z from 'zod';
import { UserGender } from '../../common/enums/user.enum.js';

export const registerSchema = z
	.strictObject({
		name: z.string().min(3).max(50),
		email: z.string().email(),
		password: z
			.string()
			.min(8)
			.max(20)
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
				{
					message:
						'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
				},
			),
		confirmPassword: z.string().min(8).max(20),
		phone: z
			.string()
			.regex(
				/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
				{
					message: 'Phone number must be 10 digits',
				},
			),
		gender: z.enum([UserGender.MALE, UserGender.FEMALE]),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
	});

export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.strictObject({
	email: z.string().email(),
	password: z
		.string()
		.min(8)
		.max(20)
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
			{
				message:
					'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
			},
		),
});

export type loginDto = z.infer<typeof loginSchema>;

export const verifySchema = z.strictObject({
	email: z.string().email(),
	otp: z.string().length(6),
});

export type verifyDto = z.infer<typeof verifySchema>;

export const resendOtpSchema = z.strictObject({
	email: z.string().trim().toLowerCase().email('Invalid email format'),
});

export type resendOtpDto = z.infer<typeof resendOtpSchema>;

export const forgetPasswordSchema = z.strictObject({
	email: z.string().trim().toLowerCase().email('Invalid email format'),
});

export type forgetPasswordDto = z.infer<typeof forgetPasswordSchema>;

export const resetPasswordSchema = z
	.strictObject({
		email: z.string().trim().toLowerCase().email('Invalid email format'),
		otp: z.string().length(6, 'OTP must be 6 digits'),
		newPassword: z
			.string()
			.min(8, 'Password must be at least 8 characters'),
		confirmNewPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: 'Passwords do not match',
		path: ['confirmNewPassword'],
	});

export type resetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const refreshSchema = z.strictObject({
	refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type refreshDto = z.infer<typeof refreshSchema>;
