import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { unlink } from 'node:fs/promises';
import { Brand } from '../../database/model/brand.model.js';
import { IBrand } from '../../common/interfaces/brand.interface.js';
import { generateSlug } from '../../common/utils/slug.utils.js';

@Injectable()
export class BrandService {
	//* ------------------------ IMAGE HELPERS ------------------------ *//
	private async uploadImage(file?: Express.Multer.File) {
		if (!file) return console.log('No File Uploaded');
		console.log('FROM UPLOAD METHOD: ', file.path);
		return file.path;
	}
	private async deleteImage(path: string | undefined) {
		if (!path) return;

		try {
			await unlink(path);
		} catch {
			// Ignore errors if the file doesn't exist or can't be deleted
		}
	}
	//* --------------------------------------------------------------- *//

	constructor(
		@InjectModel(Brand.name) private readonly brandModel: Model<IBrand>,
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
		file?: Express.Multer.File,
	) {
		const slug = generateSlug(name);
		if (!slug) {
			await this.deleteImage(file?.path);
			throw new BadRequestException('invalid brand name');
		}

		const exists = await this.brandModel.exists({ slug });
		if (exists) {
			await this.deleteImage(file?.path);
			throw new ConflictException('brand already exists');
		}

		const image = file ? await this.uploadImage(file) : undefined;

		try {
			return await this.brandModel.create({
				name,
				slug,
				image: image ?? undefined,
				createdBy: userId,
			});
		} catch (error) {
			await this.deleteImage(file?.path);

			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException('brand already exists');
			}
			throw error;
		}
	}

	async updateBrand(slug: string, name?: string, file?: Express.Multer.File) {
		const brand = await this.brandModel.findOne({
			slug,
			deletedAt: { $exists: false },
		});
		if (!brand) {
			await this.deleteImage(file?.path);
			throw new NotFoundException('brand not found');
		}

		if (!name && !file) {
			throw new BadRequestException('No data provided for update');
		}

		if (name) {
			const newSlug = generateSlug(name);
			if (!newSlug) {
				await this.deleteImage(file?.path);
				throw new BadRequestException('invalid brand name');
			}
			if (newSlug !== brand.slug) {
				const exists = await this.brandModel.exists({ slug: newSlug });
				if (exists) {
					await this.deleteImage(file?.path);
					throw new ConflictException('brand name already exists');
				}
			}
			brand.name = name;
			brand.slug = newSlug;
		}

		const oldImage = brand.image;
		if (file) {
			const image = await this.uploadImage(file);
			if (image) brand.image = image;
		}

		try {
			await brand.save();
		} catch (error) {
			await this.deleteImage(file?.path);
			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException('brand name already exists');
			}
			throw error;
		}

		if (file && oldImage && oldImage !== brand.image) {
			await this.deleteImage(oldImage);
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
