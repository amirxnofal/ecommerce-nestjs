import { z } from 'zod';

//* ------------------------ SHARED ------------------------ *//
const objectId = z
	.string()
	.regex(/^[0-9a-fA-F]{24}$/, 'invalid id');

const brandName = z
	.string()
	.trim()
	.min(2, 'name must be at least 2 characters')
	.max(50, 'name must be at most 50 characters');

//* ------------------------ CREATE ------------------------ *//
export const createBrandSchema = z
	.object({
		name: brandName,
	})
	.strict();

//* ------------------------ UPDATE ------------------------ *//
export const updateBrandSchema = z
	.object({
		name: brandName.optional(),
	})
	.strict();

//* ------------------------ PARAMS ------------------------ *//
export const brandIdParamSchema = z
	.object({
		id: objectId,
	})
	.strict();

//* ------------------------ QUERY (GET ALL) ------------------------ *//
export const getAllBrandsQuerySchema = z
	.object({
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(100).default(10),
		search: z.string().trim().min(1).max(50).optional(),
		sort: z.enum(['name', '-name', 'createdAt', '-createdAt']).default('-createdAt'),
	})
	.strict();

//* ------------------------ TYPES ------------------------ *//
export type CreateBrandDto = z.infer<typeof createBrandSchema>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
export type BrandIdParamDto = z.infer<typeof brandIdParamSchema>;
export type GetAllBrandsQueryDto = z.infer<typeof getAllBrandsQuerySchema>;