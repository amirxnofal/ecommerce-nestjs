export const generateSlug = (value: string): string =>
	value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
