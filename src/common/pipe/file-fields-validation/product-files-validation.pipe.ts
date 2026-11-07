import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

export type ProductFiles = {
	image: Express.Multer.File[];
	gallery?: Express.Multer.File[];
};

@Injectable()
export class ProductFilesValidationPipe implements PipeTransform {
	private readonly allowedMimeTypes = [
		'image/jpeg',
		'image/png',
		'image/webp',
	];
	private readonly maxSize = 5 * 1024 * 1024; // 5MB

	constructor(
		private readonly options: { imageRequired: boolean } = {
			imageRequired: true,
		},
	) {}

	async transform(files: ProductFiles): Promise<ProductFiles> {
		if (this.options.imageRequired && !files?.image?.[0]) {
			throw new BadRequestException('Product image is required');
		}

		const all = [...(files?.image ?? []), ...(files?.gallery ?? [])];

		for (const file of all) {
			if (file.size > this.maxSize) {
				throw new BadRequestException(
					`${file.originalname} exceeds the 5MB limit`,
				);
			}

			const type = await fileTypeFromBuffer(file.buffer);
			if (!type || !this.allowedMimeTypes.includes(type.mime)) {
				throw new BadRequestException(
					`${file.originalname} is not a valid image`,
				);
			}
		}

		return files;
	}
}
