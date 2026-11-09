import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import {
	Product,
	ProductDocument,
} from '../../database/model/product.model.js';
import { Brand } from '../../database/model/brand.model.js';
import { Category } from '../../database/model/category.model.js';
import { SubCategory } from '../../database/model/subCategory.model.js';
import type { IBrand } from '../../common/interfaces/brand.interface.js';
import type { ICategory } from '../../common/interfaces/category.interface.js';
import type { ISubCategory } from '../../common/interfaces/subCategory.interface.js';
import type { IImage } from '../../common/interfaces/image.interface.js';
import {
	CloudinaryService,
	FailedUpload,
} from '../../common/services/cloudinary/cloudinary.service.js';
import { ProductFiles } from '../../common/pipe/file-fields-validation/product-files-validation.pipe.js';
import { CLOUDINARY_FOLDERS } from '../../common/constants/cloudinary.constants.js';
import { randomUUID } from 'crypto';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';

@Injectable()
export class ProductService {
	private readonly logger = new Logger(Product.name);
	private readonly MAX_GALLERY = 15;

	// ---------- Helpers ----------
	private async safeDeleteImages(publicIds: string[]) {
		try {
			await this.cloudinary.deleteMany(publicIds);
		} catch (err) {
			this.logger.error(
				`Failed to cleanup images: ${publicIds.join(', ')}`,
				err,
			);
		}
	}

	private calcFinalPrice(
		originalPrice: number,
		salePrice?: number | null,
		discountPercentage = 0,
	) {
		const base = salePrice ?? originalPrice;
		return Number((base * (1 - discountPercentage / 100)).toFixed(2));
	}

	private async validateRelations(
		brand: string,
		category: string,
		subCategory: string,
	) {
		const [brandExists, categoryExists, subCategoryExists] =
			await Promise.all([
				this.brandModel.exists({ _id: brand }),
				this.categoryModel.exists({ _id: category }),
				this.subCategoryModel.exists({
					_id: subCategory,
					category: new Types.ObjectId(category),
				}),
			]);

		if (!brandExists) throw new NotFoundException('Brand not found');
		if (!categoryExists) throw new NotFoundException('Category not found');
		if (!subCategoryExists) {
			throw new BadRequestException(
				'SubCategory not found in this Category',
			);
		}
	}

	constructor(
		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,

		@InjectModel(Brand.name)
		private readonly brandModel: Model<IBrand>,

		@InjectModel(Category.name)
		private readonly categoryModel: Model<ICategory>,

		@InjectModel(SubCategory.name)
		private readonly subCategoryModel: Model<ISubCategory>,

		private readonly cloudinary: CloudinaryService,
	) {}

	// ---------- Create ----------
	async create(
		userId: Types.ObjectId,
		body: CreateProductDto,
		files: ProductFiles,
	) {
		const {
			originalPrice,
			discountPercentage = 0,
			salePrice,
			category,
			subCategory,
			brand,
			name,
			description,
			stock,
		} = body;

		await this.validateRelations(brand, category, subCategory);

		const finalPrice = this.calcFinalPrice(
			originalPrice,
			salePrice,
			discountPercentage,
		);

		const _id = new Types.ObjectId();
		const productId = randomUUID().slice(0, 6);
		let image: IImage;
		try {
			image = await this.cloudinary.uploadFile(
				files.image[0],
				CLOUDINARY_FOLDERS.PRODUCT.MAIN_IMAGE(_id.toString()),
			);
		} catch (error) {
			throw new BadRequestException('Failed to upload image');
		}

		let gallery: IImage[] = [];
		let failed: FailedUpload[] = [];

		try {
			if (files.gallery?.length) {
				({ uploaded: gallery, failed } =
					await this.cloudinary.uploadManyFiles(
						files.gallery,
						CLOUDINARY_FOLDERS.PRODUCT.GALLERY(_id.toString()),
					));
			}

			const product = await this.productModel.create({
				_id,
				productId,
				name,
				description,
				stock,
				originalPrice,
				salePrice,
				discountPercentage,
				finalPrice,
				category,
				subCategory,
				brand,
				image,
				gallery,
				createdBy: userId,
			});

			return {
				product,
				...(failed.length > 0
					? {
							warning: 'Some gallery images failed to upload',
							failedImages: failed,
						}
					: {}),
			};
		} catch (error) {
			await this.safeDeleteImages([
				image.public_id,
				...gallery.map((i) => i.public_id),
			]);
			throw error;
		}
	}
	// ---------- Read ----------
	async findAll({ page = 1, limit = 10 }: PaginationQueryDto) {
		const filter = { deletedAt: null };

		const [products, total] = await Promise.all([
			this.productModel
				.find(filter)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.populate('category subCategory brand', 'name slug')
				.lean(),
			this.productModel.countDocuments(filter),
		]);

		return {
			data: products,
			meta: { total, page, limit, pages: Math.ceil(total / limit) },
		};
	}

	async findOne(slug: string) {
		const product = await this.productModel
			.findOne({ slug, deletedAt: null })
			.populate('category subCategory brand', 'name slug');

		if (!product) throw new NotFoundException('Product not found');
		return product;
	}

	// ---------- Update ----------
	async update(
		productId: string,
		body: UpdateProductDto,
		userId: Types.ObjectId,
		files?: ProductFiles,
	) {
		const product = await this.productModel.findOne({
			productId,
			deletedAt: null,
		});
		if (!product) throw new NotFoundException('Product not found');

		const { removeImages, ...rest } = body;

		const category = body.category ?? product.category.toString();
		const subCategory = body.subCategory ?? product.subCategory.toString();
		const brand = body.brand ?? product.brand.toString();

		if (body.category || body.subCategory || body.brand) {
			await this.validateRelations(brand, category, subCategory);
		}

		const uploaded: IImage[] = [];
		const oldPublicIds: string[] = [];

		try {
			// ---------- Main image ----------
			if (files?.image?.[0]) {
				const image = await this.cloudinary.uploadFile(
					files.image[0],
					CLOUDINARY_FOLDERS.PRODUCT.MAIN_IMAGE(
						product._id.toString(),
					),
				);
				uploaded.push(image);
				oldPublicIds.push(product.image.public_id);
				product.image = image;
			}

			// ---------- Gallery: add + remove ----------
			const newCount = files?.gallery?.length ?? 0;

			if (newCount || removeImages?.length) {
				const currentIds = product.gallery.map((i) => i.public_id);
				const toRemove = (removeImages ?? []).filter((id) =>
					currentIds.includes(id),
				);

				const kept = product.gallery.filter(
					(i) => !toRemove.includes(i.public_id),
				);

				if (kept.length + newCount > this.MAX_GALLERY) {
					throw new BadRequestException(
						`Gallery can't exceed ${this.MAX_GALLERY} images`,
					);
				}

				let newImages: IImage[] = [];
				if (newCount) {
					const { uploaded: gallery, failed } =
						await this.cloudinary.uploadManyFiles(
							files!.gallery!,
							CLOUDINARY_FOLDERS.PRODUCT.GALLERY(
								product._id.toString(),
							),
						);

					uploaded.push(...gallery);

					if (failed.length) {
						throw new BadRequestException(
							`Failed to upload: ${failed.map((f) => f.originalName).join(', ')}`,
						);
					}

					newImages = gallery;
				}

				product.gallery = [...kept, ...newImages];
				oldPublicIds.push(...toRemove);
			}

			// ---------- Update fields ----------
			product.set({
				...rest,
				category,
				subCategory,
				brand,
				updatedBy: userId,
			});

			if (
				body.originalPrice !== undefined ||
				body.discountPercentage !== undefined
			) {
				product.finalPrice = this.calcFinalPrice(
					product.originalPrice,
					product.salePrice,
					product.discountPercentage,
				);
			}

			await product.save();
		} catch (error) {
			await this.cloudinary
				.deleteMany(uploaded.map((i) => i.public_id))
				.catch(() => {});
			throw error;
		}

		await this.cloudinary
			.deleteMany(oldPublicIds)
			.catch((err) =>
				this.logger.error(`Old images cleanup failed: ${err.message}`),
			);

		return product;
	}

	// ---------- Soft delete / Restore ----------
	async remove(id: Types.ObjectId | string, userId: Types.ObjectId) {
		const product = await this.productModel.findOneAndUpdate(
			{ _id: id, deletedAt: null },
			{ deletedAt: new Date(), updatedBy: userId },
			{ after: true },
		);
		if (!product) throw new NotFoundException('Product not found');

		return { message: 'Product deleted successfully', slug: product.slug };
	}

	async restore(id: Types.ObjectId | string, userId: Types.ObjectId) {
		const product = await this.productModel.findOneAndUpdate(
			{ _id: id, deletedAt: { $ne: null } },
			{ deletedAt: null, restoredAt: new Date(), updatedBy: userId },
			{ after: true },
		);
		if (!product) throw new NotFoundException('Deleted product not found');
		return product;
	}

	//* <---------------- GQL Methods ----------------> *\\
	async findAllByGQL({ page = 1, limit = 10 }: PaginationQueryDto) {
		const filter = { deletedAt: null };

		const [products, total] = await Promise.all([
			this.productModel
				.find(filter)
				.sort({ createdAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit)
				.lean(),
			this.productModel.countDocuments(filter),
		]);

		return {
			data: products,
			meta: { total, page, limit, pages: Math.ceil(total / limit) },
		};
	}

	async findOneByGQL(slug: string) {
		const product = await this.productModel.findOne({
			slug,
			deletedAt: null,
		});

		if (!product) throw new NotFoundException('Product not found');
		return product;
	}

	async findRelation(
		model: 'category' | 'subCategory' | 'brand',
		id: Types.ObjectId,
	) {
		const models: Record<typeof model, Model<any>> = {
			category: this.categoryModel,
			subCategory: this.subCategoryModel,
			brand: this.brandModel,
		};
		return models[model].findById(id, 'name slug').lean();
	}
}
