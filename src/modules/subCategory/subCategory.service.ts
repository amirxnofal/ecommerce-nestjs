import {
	ConflictException,
	Injectable,
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

@Injectable()
export class SubCategoryService {
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<ICategory>,
		@InjectModel(SubCategory.name)
		private readonly subCategoryModel: Model<ISubCategory>,
	) {}
	private readonly cloudinary: any;

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

	//* Add new subcategory
	async createSubCategory(
		data: CreateSubCategoryDto,
		createdBy: Types.ObjectId,
		file?: any,
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

		let image: { public_id: string; secure_url: string } | undefined;
		if (file) {
			// const uploadResult = await this.cloudinary.upload(
			// 	file.path,
			// 	'subcategories/subCategoryImage',
			// );
			const uploadResult = {
				public_id: 'subcategories/subCategoryImage',
				secure_url: 'subcategories/subCategoryImage',
			};

			image = {
				public_id: uploadResult.public_id,
				secure_url: uploadResult.secure_url,
			};
		}

		try {
			const subCategory = await this.subCategoryModel.create({
				name,
				description,
				category,
				subCategoryImage: image,
				createdBy,
			});
			return { subCategory };
		} catch (error: any) {
			if (image) await this.cloudinary.destroy(image.public_id);
			if (error.code === 11000) {
				throw new ConflictException(
					'SubCategory already exist in this category!',
				);
			}
			throw error;
		}
	}

	//* Edit subcategory
	async updateSubCategory(
		subCategoryId: string,
		data: UpdateSubCategoryDto,
		file?: any,
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
		let newPublicId: string | null = null;

		if (file) {
			// const uploadResult = await this.cloudinary.upload(
			// 	file.path,
			// 	'subcategories/subCategoryImage',
			// );
			const uploadResult = {
				public_id: 'subcategories/subCategoryImage',
				secure_url: 'subcategories/subCategoryImage',
			};
			newPublicId = uploadResult.public_id;
			subCategory.subCategoryImage = {
				public_id: uploadResult.public_id,
				secure_url: uploadResult.secure_url,
			};
		}

		try {
			await subCategory.save();
		} catch (error: any) {
			// if (newPublicId) await this.cloudinary.destroy(newPublicId);
			if (error.code === 11000) {
				throw new ConflictException(
					'SubCategory already exist in this category!',
				);
			}
			throw error;
		}

		// remove the old image only after a successful save
		if (newPublicId && oldPublicId) {
			// await this.cloudinary.destroy(oldPublicId);
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
