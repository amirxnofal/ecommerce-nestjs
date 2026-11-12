import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ICategory } from '../../common/interfaces/category.interface.js';
import { ISubCategory } from '../../common/interfaces/subCategory.interface.js';
import { SubCategory } from '../../database/model/subCategory.model.js';
import { Category } from '../../database/model/category.model.js';
import {
	CreateSubCategoryDto,
	UpdateSubCategoryDto,
} from './subCategory.validation.js';
import { CLOUDINARY_FOLDERS } from '../../common/constants/cloudinary.constants.js';
import { IImage } from '../../common/interfaces/image.interface.js';
import { CloudinaryService } from '../../common/services/cloudinary/cloudinary.service.js';

@Injectable()
export class SubCategoryService {
	private readonly logger = new Logger(SubCategory.name);
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<ICategory>,
		@InjectModel(SubCategory.name)
		private readonly subCategoryModel: Model<ISubCategory>,
		private readonly cloudinary: CloudinaryService,
	) {}

	//* Get all subcategories (optionally filtered by category)
	async getSubCategories(categoryId?: string) {
		const filter: Record<string, any> = { deletedAt: null };
		if (categoryId) filter.category = new Types.ObjectId(categoryId);
		const subCategories = await this.subCategoryModel
			.find(filter)
			.sort({ createdAt: -1 });

		return { subCategories };
	}

	//* Get subcategory by id
	async getSubCategoryById(subCategoryId: string) {
		const subCategory = await this.subCategoryModel
			.findOne({ _id: subCategoryId, deletedAt: null })
			.populate('category', 'name slug');
		if (!subCategory) throw new NotFoundException('SubCategory not found!');

		return { subCategory };
	}

	//* Create
	async createSubCategory(
		data: CreateSubCategoryDto,
		createdBy: Types.ObjectId,
		file: Express.Multer.File,
	) {
		const { name, description, category } = data;

		const parentExists = await this.categoryModel.exists({
			_id: category,
			deletedAt: null,
		});
		if (!parentExists) throw new NotFoundException('Category not found!');

		const isExist = await this.subCategoryModel.exists({
			category,
			name,
			deletedAt: null,
		});
		if (isExist) {
			throw new ConflictException(
				'SubCategory already exist in this category!',
			);
		}

		const _id = new Types.ObjectId();

		let uploaded: IImage | undefined;
		if (file) {
			try {
				uploaded = await this.cloudinary.uploadFile(
					file,
					CLOUDINARY_FOLDERS.SUBCATEGORY.IMAGE(_id.toString()),
				);
			} catch (error) {
				this.logger.error('SubCategory image upload failed', error);
				throw new BadRequestException('Failed to upload image');
			}
		}

		try {
			const subCategory = await this.subCategoryModel.create({
				_id,
				name,
				description,
				category,
				subCategoryImage: uploaded,
				createdBy,
			});
			return { subCategory };
		} catch (error) {
			if (uploaded) {
				await this.cloudinary
					.deleteFile(uploaded.public_id)
					.catch((e: any) =>
						this.logger.error('Failed to cleanup image', e),
					);
			}
			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException(
					'SubCategory already exist in this category!',
				);
			}
			throw error;
		}
	}

	//* Update
	async updateSubCategory(
		subCategoryId: string,
		data: UpdateSubCategoryDto,
		file?: Express.Multer.File,
	) {
		const { name, description } = data;

		const subCategory = await this.subCategoryModel.findOne({
			_id: subCategoryId,
			deletedAt: null,
		});
		if (!subCategory) throw new NotFoundException('SubCategory not found!');

		if (name) {
			const exists = await this.subCategoryModel.exists({
				category: subCategory.category,
				name,
				deletedAt: null,
				_id: { $ne: subCategoryId },
			});
			if (exists) {
				throw new ConflictException(
					'SubCategory already exist in this category!',
				);
			}
			subCategory.name = name;
		}
		if (description !== undefined) subCategory.description = description;

		const oldPublicId = subCategory.subCategoryImage?.public_id;

		let newImage: IImage | undefined;
		if (file) {
			try {
				const uploaded = await this.cloudinary.uploadFile(
					file,
					CLOUDINARY_FOLDERS.SUBCATEGORY.IMAGE(
						subCategory._id.toString(),
					),
				);
				newImage = {
					secure_url: uploaded.secure_url,
					public_id: uploaded.public_id,
				};
			} catch (error) {
				this.logger.error('SubCategory image upload failed', error);
				throw new BadRequestException('Failed to upload image');
			}
			subCategory.subCategoryImage = newImage;
		}

		try {
			await subCategory.save();
		} catch (error) {
			if (newImage) {
				await this.cloudinary
					.deleteFile(newImage.public_id)
					.catch((e: any) =>
						this.logger.error('Failed to cleanup new image', e),
					);
			}
			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException(
					'SubCategory already exist in this category!',
				);
			}
			throw error;
		}

		if (newImage && oldPublicId) {
			await this.cloudinary
				.deleteFile(oldPublicId)
				.catch((e: any) =>
					this.logger.error('Failed to cleanup old image', e),
				);
		}

		return { subCategory };
	}

	//* Delete subcategory (soft delete)
	async deleteSubCategory(subCategoryId: string) {
		const subCategory = await this.subCategoryModel.findOne({
			_id: subCategoryId,
			deletedAt: null,
		});
		if (!subCategory) throw new NotFoundException('SubCategory not found!');

		// TODO: block delete if it has products

		subCategory.deletedAt = new Date();
		await subCategory.save();

		return { subCategory };
	}
}
