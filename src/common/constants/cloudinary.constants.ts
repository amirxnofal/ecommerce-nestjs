const ROOT = 'ecommerce';

export const CLOUDINARY_FOLDERS = {
	BRAND: {
		LOGO: (brandId: string) => `${ROOT}/brands/${brandId}`,
	},
	CATEGORY: {
		IMAGE: (categoryId: string) => `${ROOT}/categories/${categoryId}`,
	},
	SUBCATEGORY: {
		IMAGE: (subCategoryId: string) =>
			`${ROOT}/subcategories/${subCategoryId}`,
	},
	PRODUCT: {
		MAIN_IMAGE: (productId: string) => `${ROOT}/products/${productId}/main`,
		GALLERY: (productId: string) => `${ROOT}/products/${productId}/gallery`,
	},
} as const;

export const CLOUDINARY_DEFAULTS = {
	BRAND_LOGO: `${ROOT}/default/brandLogo.png`,
	CATEGORY_IMAGE: `${ROOT}/default/categoryImage.png`,
} as const;
