import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from '../../database/model/category.model.js';
import { SubCategory } from '../../database/model/subCategory.model.js';
import { Model } from 'mongoose';
import { ISubCategory } from '../../common/interfaces/subCategory.interface.js';
import { ICategory } from '../../common/interfaces/category.interface.js';
import { CreateCategoryDto, UpdateCategoryDto } from './category.validation.js';

@Injectable()
export class CategoryService {
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<ICategory>,
		@InjectModel(SubCategory.name)
		private readonly subCategoryModel: Model<ISubCategory>,
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
	async createCategory(data: CreateCategoryDto, createdBy: any, file?: any) {
		const { name, description } = data;

		if (!file) throw new BadRequestException('Must upload category image');

		const isExist = await this.categoryModel.exists({
			name,
			deletedAt: null,
		});
		if (isExist) throw new ConflictException('Category already exist!');

		// const uploadResult = await this.cloudinary.upload(
		// 	file.path,
		// 	`categories/categoryImage`,
		// );
		const uploadResult = { public_id: '', secure_url: '' };

		try {
			const category = await this.categoryModel.create({
				name,
				description,
				categoryImage: {
					public_id: uploadResult.public_id,
					secure_url: uploadResult.secure_url,
				},
				createdBy: createdBy.userId,
			});
			return { category };
		} catch (error: any) {
			// await this.cloudinary.destroy(uploadResult.public_id);
			if (error.code === 11000) {
				throw new ConflictException('Category already exist!');
			}
			throw error;
		}
	}

	//* Edit category
	async updateCategory(
		categoryId: string,
		data: UpdateCategoryDto,
		file?: any,
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
		let newPublicId: string | null = null;

		if (file) {
			// const uploadResult = await this.cloudinary.upload(
			// 	file.path,
			// 	`categories/categoryImage`,
			// );
			const uploadResult = { public_id: '', secure_url: '' };

			newPublicId = uploadResult.public_id;
			category.categoryImage = {
				public_id: uploadResult.public_id,
				secure_url: uploadResult.secure_url,
			};
		}

		try {
			await category.save();
		} catch (error: any) {
			if (newPublicId) {
				// await this.cloudinary.destroy(newPublicId);
			}
			if (error.code === 11000) {
				throw new ConflictException('Category already exist!');
			}
			throw error;
		}

		// remove the old image only after a successful save
		if (newPublicId && oldPublicId) {
			// await this.cloudinary.destroy(oldPublicId);
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
