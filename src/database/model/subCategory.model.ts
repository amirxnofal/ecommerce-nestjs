import { Types } from 'mongoose';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { generateSlug } from '../../common/utils/slug.utils.js';

@Schema({ timestamps: true })
export class SubCategory {
	@Prop({ required: true, trim: true })
	name: string;

	@Prop({ required: true })
	slug: string;

	@Prop({ trim: true })
	description?: string;

	@Prop({ type: Object })
	subCategoryImage?: { secure_url: string; public_id: string };

	@Prop({ type: Types.ObjectId, ref: 'Category', required: true })
	category: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	createdBy: Types.ObjectId;

	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

export const subCategorySchema = SchemaFactory.createForClass(SubCategory);

subCategorySchema.index(
	{ category: 1, name: 1 },
	{ unique: true, partialFilterExpression: { deletedAt: { $type: 'null' } } },
);
subCategorySchema.index(
	{ category: 1, slug: 1 },
	{ unique: true, partialFilterExpression: { deletedAt: { $type: 'null' } } },
);

subCategorySchema.pre('validate', function () {
	if (this.isModified('name')) {
		this.slug = generateSlug(this.name);
	}
});

export const subCategoryModel = MongooseModule.forFeature([
	{ name: SubCategory.name, schema: subCategorySchema },
]);
