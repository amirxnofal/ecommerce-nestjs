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
