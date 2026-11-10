import { Types } from 'mongoose';
import { CouponType } from '../enums/coupon.enum.js';

export interface ICoupon {
	_id: Types.ObjectId;

	code: string;
	type: CouponType;
	discount: number;

	maxDiscount?: number;
	minOrderAmount?: number;

	startsAt?: Date;
	expire: Date;

	usageLimit?: number;
	usedCount: number;
	usedBy: Types.ObjectId[];

	isActive: boolean;

	createdBy: Types.ObjectId;
	deletedAt?: Date;
	deletedBy?: Types.ObjectId;
	restoredAt?: Date;
	restoredBy?: Types.ObjectId;

	createdAt: Date;
	updatedAt: Date;
}