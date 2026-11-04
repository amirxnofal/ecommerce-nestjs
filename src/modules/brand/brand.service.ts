import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { unlink } from 'node:fs/promises';
import { Brand } from '../../database/model/brand.model.js';
import { IBrand } from '../../common/interfaces/brand.interface.js';
import { generateSlug } from '../../common/utils/slug.utils.js';
import { CloudinaryService } from '../../common/services/cloudinary/cloudinary.service.js';
import { CLOUDINARY_FOLDERS } from '../../common/constants/cloudinary.constants.js';
import { UploadApiResponse } from 'cloudinary';
import { IImage } from '../../common/interfaces/image.interface.js';

@Injectable()
export class BrandService {
	//* --------------------------------------------------------------- *//
	private readonly logger = new Logger(Brand.name);
	constructor(
		@InjectModel(Brand.name) private readonly brandModel: Model<IBrand>,
		private readonly cloudinary: CloudinaryService,
	) {}

	async getAllBrands() {
		return this.brandModel.find({ deletedAt: { $exists: false } });
	}

	async getBrandBySlug(slug: string) {
		return this.brandModel.findOne({ slug, deletedAt: { $exists: false } });
	}

	async createBrand(
		userId: Types.ObjectId,
		name: string,
		file: Express.Multer.File,
	): Promise<HydratedDocument<IBrand>> {
		const slug = generateSlug(name);
		if (!slug) {
			throw new BadRequestException('invalid brand name');
		}

		const exists = await this.brandModel.exists({ slug });
		if (exists) {
			throw new ConflictException('brand already exists');
		}

		const _id = new Types.ObjectId();

		let uploadedImage: UploadApiResponse;
		try {
			uploadedImage = await this.cloudinary.uploadFile(
				file,
				CLOUDINARY_FOLDERS.BRAND.LOGO(_id.toString()),
			);
		} catch (error) {
			throw new BadRequestException('Failed to upload image');
		}

		try {
			return await this.brandModel.create({
				_id,
				name,
				slug,
				createdBy: userId,
				image: {
					secure_url: uploadedImage.secure_url,
					public_id: uploadedImage.public_id,
				},
			});
		} catch (error) {
			await this.cloudinary
				.deleteFile(uploadedImage.public_id)
				.catch((e) => this.logger.error('Failed to cleanup image', e));

			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException('brand already exists');
			}
			throw error;
		}
	}

	async updateBrand(slug: string, name?: string, file?: Express.Multer.File) {
		if (!name && !file) {
			throw new BadRequestException('No data provided for update');
		}

		const brand = await this.brandModel.findOne({
			slug,
			deletedAt: { $exists: false },
		});
		if (!brand) throw new NotFoundException('brand not found');

		if (name) {
			const newSlug = generateSlug(name);
			if (!newSlug) throw new BadRequestException('invalid brand name');

			if (newSlug !== brand.slug) {
				const exists = await this.brandModel.exists({ slug: newSlug });
				if (exists)
					throw new ConflictException('brand name already exists');
			}
			brand.name = name;
			brand.slug = newSlug;
		}

		const oldPublicId = brand.image?.public_id;

		let newImage: IImage | undefined;
		if (file) {
			try {
				const uploaded = await this.cloudinary.uploadFile(
					file,
					CLOUDINARY_FOLDERS.BRAND.LOGO(brand._id.toString()),
				);
				newImage = {
					secure_url: uploaded.secure_url,
					public_id: uploaded.public_id,
				};
			} catch (error) {
				this.logger.error('Brand logo upload failed', error);
				throw new BadRequestException('Failed to upload image');
			}
			brand.image = newImage;
		}

		try {
			await brand.save();
		} catch (error) {
			if (newImage) {
				await this.cloudinary
					.deleteFile(newImage.public_id)
					.catch((e) =>
						this.logger.error('Failed to cleanup new image', e),
					);
			}
			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException('brand name already exists');
			}
			throw error;
		}

		if (newImage && oldPublicId) {
			await this.cloudinary
				.deleteFile(oldPublicId)
				.catch((e) =>
					this.logger.error('Failed to cleanup old image', e),
				);
		}

		return brand;
	}
	
	async deleteBrand(slug: string) {
		const brand = await this.brandModel.findOneAndUpdate(
			{ slug, deletedAt: { $exists: false } },
			{ deletedAt: new Date() },
			{ returnDocument: 'after' },
		);
		if (!brand) throw new BadRequestException('Brand Not exist');

		return brand;
	}

	async restoreBrand(slug: string) {
		const brand = await this.brandModel.findOneAndUpdate(
			{ slug, deletedAt: { $exists: true } },
			{ restoredAt: new Date() },
			{ returnDocument: 'after' },
		);
		if (!brand) throw new BadRequestException('Brand Not exist');

		return brand;
	}
}
