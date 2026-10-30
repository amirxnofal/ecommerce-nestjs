import { Types } from 'mongoose';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { generateSlug } from '../../common/utils/slug.utils.js';
import type { IImage } from '../../common/interfaces/image.interface.js';

@Schema({ timestamps: true })
export class Category {
	@Prop({ required: true, trim: true })
	name: string;

	@Prop({ required: true })
	slug: string;

	@Prop({ trim: true })
	description?: string;

	@Prop({ type: Object })
	categoryImage?: IImage;

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	createdBy: Types.ObjectId;

	@Prop({ type: Date, default: null })
	deletedAt?: Date | null;
}

export const categorySchema = SchemaFactory.createForClass(Category);

categorySchema.index(
	{ name: 1 },
	{ unique: true, partialFilterExpression: { deletedAt: null } },
);
categorySchema.index(
	{ slug: 1 },
	{ unique: true, partialFilterExpression: { deletedAt: null } },
);

categorySchema.pre('validate', function () {
	if (this.isModified('name')) {
		this.slug = generateSlug(this.name);
	}
});

export const categoryModel = MongooseModule.forFeature([
	{ name: Category.name, schema: categorySchema },
]);
