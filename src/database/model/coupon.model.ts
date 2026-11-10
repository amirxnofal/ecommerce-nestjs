import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CouponType } from '../../common/enums/coupon.enum.js';

@Schema({ timestamps: true })
export class Coupon {
	@Prop({ required: true, trim: true, uppercase: true })
	code: string;

	@Prop({ required: true, enum: CouponType })
	type: CouponType;

	@Prop({ required: true, min: 0 })
	discount: number;

	@Prop({ min: 0 })
	maxDiscount?: number;

	@Prop({ min: 0, default: 0 })
	minOrderAmount?: number;

	@Prop()
	startsAt?: Date;

	@Prop({ required: true })
	expire: Date;

	@Prop({ min: 1 })
	usageLimit?: number;

	@Prop({ default: 0, min: 0 })
	usedCount: number;

	@Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
	usedBy: Types.ObjectId[];

	@Prop({ default: true })
	isActive: boolean;

	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	createdBy: Types.ObjectId;

	@Prop({ type: Date, default: null })
	deletedAt?: Date;

	@Prop({ type: Types.ObjectId, ref: 'User' })
	deletedBy?: Types.ObjectId;

	@Prop()
	restoredAt?: Date;

	@Prop({ type: Types.ObjectId, ref: 'User' })
	restoredBy?: Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
export const CouponModel = MongooseModule.forFeature([
	{ name: Coupon.name, schema: CouponSchema },
]);

CouponSchema.index(
	{ code: 1 },
	{ unique: true, partialFilterExpression: { deletedAt: { $type: 'null' } } },
);
CouponSchema.index({ expire: 1 });
