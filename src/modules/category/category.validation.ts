import { Types } from 'mongoose';
import { z } from 'zod';

//* Reusable ObjectId validator
export const objectIdSchema = z
	.string()
	.refine((value) => Types.ObjectId.isValid(value), {
		message: 'Invalid id',
	});

//* Params: /categories/:categoryId
export const categoryIdParamSchema = z.object({
	categoryId: objectIdSchema,
});

//* Create category
export const createCategorySchema = z
	.object({
		name: z
			.string({ error: 'Name is required' })
			.trim()
			.min(2, 'Name must be at least 2 characters')
			.max(50, 'Name must be at most 50 characters'),
		description: z
			.string()
			.trim()
			.min(2, 'Description must be at least 2 characters')
			.max(500, 'Description must be at most 500 characters')
			.optional(),
	})
	.strict();

export const updateCategorySchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(2, 'Name must be at least 2 characters')
			.max(50, 'Name must be at most 50 characters')
			.optional(),
		description: z
			.string()
			.trim()
			.min(2, 'Description must be at least 2 characters')
			.max(500, 'Description must be at most 500 characters')
			.optional(),
	})
	.strict();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
