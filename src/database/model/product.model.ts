import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { generateSlug } from '../../common/utils/slug.utils.js';
import { ImageSchema } from './image.model.js';
import type { IImage } from '../../common/interfaces/image.interface.js';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
	@Prop({ type: String, required: true, trim: true })
	productId: string;

	@Prop({ type: String, required: true, trim: true })
	name: string;

	@Prop({ type: String, trim: true })
	description: string;

	@Prop({ type: String, required: true })
	slug: string;

	@Prop({ type: ImageSchema, required: true })
	image: IImage;

	@Prop({ type: [ImageSchema], default: [] })
	gallery: IImage[];

	@Prop({ type: Number, default: 0, min: 0 })
	stock: number;

	@Prop({ type: Number, default: 0, min: 0, max: 5 })
	rating: number;

	@Prop({ type: Number, required: true, min: 0 })
	originalPrice: number;

	@Prop({ type: Number, default: 0, min: 0, max: 100 })
	discountPercentage: number;

	@Prop({ type: Number, required: false, min: 0 })
	salePrice: number;

	@Prop({ type: Number, required: true, min: 0 })
	finalPrice: number;

	@Prop({
		type: Types.ObjectId,
		ref: 'Category',
		required: true,
	})
	category: Types.ObjectId;

	@Prop({
		type: Types.ObjectId,
		ref: 'SubCategory',
		required: true,
	})
	subCategory: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
	brand: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	createdBy: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'User' })
	updatedBy: Types.ObjectId;

	@Prop({ type: Date, default: null })
	deletedAt: Date | null;

	@Prop({ type: Date })
	restoredAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ category: 1, subCategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index(
	{ slug: 1 },
	{ unique: true, partialFilterExpression: { deletedAt: { $type: 'null' } } },
);

ProductSchema.pre('validate', function () {
	if (this.isNew || this.isModified('name')) {
		this.slug = `${generateSlug(this.name)}-${this._id.toString().slice(-6)}`;
	}
});

export const ProductModel = MongooseModule.forFeature([
	{ name: Product.name, schema: ProductSchema },
]);
