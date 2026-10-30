import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IBrand } from '../../common/interfaces/brand.interface.js';
import { HydratedDocument } from 'mongoose';
import { generateSlug } from '../../common/utils/slug.utils.js';

export type BrandDocument = HydratedDocument<IBrand>;

@Schema()
export class Brand {
	@Prop({ type: String, required: true })
	name: string;

	@Prop({ type: String, unique: true })
	slug: string;

	@Prop({ type: String })
	image: string;

	@Prop({ type: String, required: true, ref: 'User' })
	createdBy: string;

	@Prop({ type: String, ref: 'User' })
	updatedBy: string;

	@Prop({ type: Date })
	createdAt: Date;

	@Prop({ type: Date })
	updatedAt: Date;

	@Prop({ type: Date })
	deletedAt: Date;

	@Prop({ type: Date })
	restoredAt: Date;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

export const BrandModel = MongooseModule.forFeatureAsync([
	{
		name: Brand.name,
		useFactory: () => {
			BrandSchema.pre('save', function (this) {
				if (this.isModified('name')) {
					this.slug = generateSlug(this.name);
				}
			});

			return BrandSchema;
		},
	},
]);
