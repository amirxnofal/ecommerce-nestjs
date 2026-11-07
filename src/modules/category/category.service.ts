import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from '../../database/model/category.model.js';
import { SubCategory } from '../../database/model/subCategory.model.js';
import { Model, Types } from 'mongoose';
import { ISubCategory } from '../../common/interfaces/subCategory.interface.js';
import { ICategory } from '../../common/interfaces/category.interface.js';
import { CreateCategoryDto, UpdateCategoryDto } from './category.validation.js';
import { CloudinaryService } from '../../common/services/cloudinary/cloudinary.service.js';
import { UploadApiResponse } from 'cloudinary';
import { CLOUDINARY_FOLDERS } from '../../common/constants/cloudinary.constants.js';
import { IImage } from '../../common/interfaces/image.interface.js';

@Injectable()
export class CategoryService {
	private readonly logger = new Logger(Category.name);
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<ICategory>,
		@InjectModel(SubCategory.name)
		private readonly subCategoryModel: Model<ISubCategory>,
		private readonly cloudinary: CloudinaryService,
	) {}

	//* Get all categories
	async getCategories() {
		const categories = await this.categoryModel
			.find({ deletedAt: null })
			.sort({ createdAt: -1 });
		return { categories };
	}

	//* Get category by id
	async getCategoryById(categoryId: string) {
		const category = await this.categoryModel.findOne({
			_id: categoryId,
			deletedAt: null,
		});
		if (!category) throw new NotFoundException('Category not found!');

		return { category };
	}

	//* Add new category
	async createCategory(
		data: CreateCategoryDto,
		createdBy: { userId: Types.ObjectId },
		file?: Express.Multer.File,
	) {
		const { name, description } = data;

		if (!file) throw new BadRequestException('Must upload category image');

		const isExist = await this.categoryModel.exists({
			name,
			deletedAt: null,
		});
		if (isExist) throw new ConflictException('Category already exist!');

		const _id = new Types.ObjectId();

		let uploadedImage: IImage;
		try {
			uploadedImage = await this.cloudinary.uploadFile(
				file,
				CLOUDINARY_FOLDERS.CATEGORY.IMAGE(_id.toString()),
			);
		} catch (error) {
			this.logger.error('Category image upload failed', error);
			throw new BadRequestException('Failed to upload image');
		}

		try {
			return await this.categoryModel.create({
				_id,
				name,
				description,
				categoryImage: uploadedImage,
				createdBy: createdBy.userId,
			});
		} catch (error) {
			await this.cloudinary
				.deleteFile(uploadedImage.public_id)
				.catch((e) => this.logger.error('Failed to cleanup image', e));

			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException('Category already exist!');
			}
			throw error;
		}
	}

	//* Edit category
	async updateCategory(
		categoryId: string,
		data: UpdateCategoryDto,
		file?: Express.Multer.File,
	) {
		const { name, description } = data;

		const category = await this.categoryModel.findOne({
			_id: categoryId,
			deletedAt: null,
		});
		if (!category) throw new NotFoundException('Category not found!');

		if (name) {
			const exists = await this.categoryModel.exists({
				name,
				deletedAt: null,
				_id: { $ne: categoryId },
			});
			if (exists) throw new ConflictException('Category already exist!');
			category.name = name;
		}
		if (description !== undefined) category.description = description;

		const oldPublicId = category.categoryImage?.public_id;

		let newImage: IImage | undefined;
		if (file) {
			try {
				const uploaded = await this.cloudinary.uploadFile(
					file,
					CLOUDINARY_FOLDERS.CATEGORY.IMAGE(category._id.toString()),
				);
				newImage = {
					secure_url: uploaded.secure_url,
					public_id: uploaded.public_id,
				};
			} catch (error) {
				this.logger.error('Category image upload failed', error);
				throw new BadRequestException('Failed to upload image');
			}
			category.categoryImage = newImage;
		}

		try {
			await category.save();
		} catch (error) {
			if (newImage) {
				await this.cloudinary
					.deleteFile(newImage.public_id)
					.catch((e) =>
						this.logger.error('Failed to cleanup new image', e),
					);
			}
			if ((error as { code?: number }).code === 11000) {
				throw new ConflictException('Category already exist!');
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

		return { category };
	}

	//* Delete category (soft delete)
	async deleteCategory(categoryId: string) {
		const category = await this.categoryModel.findOne({
			_id: categoryId,
			deletedAt: null,
		});
		if (!category) throw new NotFoundException('Category not found!');

		const hasSubCategories = await this.subCategoryModel.exists({
			category: category._id,
			deletedAt: null,
		});
		if (hasSubCategories) {
			throw new ConflictException(
				"Can't delete category when it has subcategories!",
			);
		}

		category.deletedAt = new Date();
		await category.save();

		return { category };
	}
}
