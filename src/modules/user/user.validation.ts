import { z } from 'zod';
import { UserGender } from '../../common/enums/user.enum.js';

export const updateProfileSchema = z.strictObject({
	name: z.string().trim().min(3).max(50).optional(),
	phone: z
		.string()
		.regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
		.optional(),
	gender: z.enum([UserGender.MALE, UserGender.FEMALE]).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z.strictObject({
	password: z.string().min(1).max(100),
});

export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;
