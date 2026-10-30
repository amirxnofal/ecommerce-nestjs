import { z } from 'zod';
import { objectIdSchema } from '../category/category.validation.js';

export const subCategoryIdParamSchema = z.object({
	subCategoryId: objectIdSchema,
});

export const subCategoryQuerySchema = z.object({
	category: objectIdSchema.optional(),
});

export const createSubCategorySchema = z
	.object({
		name: z
			.string({ error: 'Name is required' })
			.trim()
			.min(2, 'Name must be at least 2 characters')
			.max(50, 'Name must be at most 50 characters'),
		description: z.string().trim().min(2).max(500).optional(),
		category: objectIdSchema,
	})
	.strict();

export const updateSubCategorySchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(2, 'Name must be at least 2 characters')
			.max(50, 'Name must be at most 50 characters')
			.optional(),
		description: z.string().trim().min(2).max(500).optional(),
	})
	.strict();

export type SubCategoryIdParam = z.infer<typeof subCategoryIdParamSchema>;
export type SubCategoryQuery = z.infer<typeof subCategoryQuerySchema>;
export type CreateSubCategoryDto = z.infer<typeof createSubCategorySchema>;
export type UpdateSubCategoryDto = z.infer<typeof updateSubCategorySchema>;
