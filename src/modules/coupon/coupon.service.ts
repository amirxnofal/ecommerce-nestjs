import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { Coupon } from '../../database/model/coupon.model.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';
import { ICoupon } from '../../common/interfaces/coupon.interface.js';
import { CouponType } from '../../common/enums/coupon.enum.js';

@Injectable()
export class CouponsService {
	constructor(@InjectModel(Coupon.name) private couponModel: Model<Coupon>) {}

	async create(body: CreateCouponDto, adminId: Types.ObjectId) {
		const exists = await this.couponModel.exists({
			code: body.code.toUpperCase(),
			deletedAt: null,
		});
		if (exists) throw new ConflictException('Coupon code already exists');

		return this.couponModel.create({ ...body, createdBy: adminId });
	}

	async findAll() {
		return this.couponModel
			.find({ deletedAt: null })
			.sort({ createdAt: -1 });
	}

	async update(id: string, body: UpdateCouponDto) {
		const coupon = await this.couponModel.findOneAndUpdate(
			{ _id: id, deletedAt: null },
			body,
			{ returnDocument: 'after' },
		);
		if (!coupon) throw new NotFoundException('Coupon not found');
		return coupon;
	}

	async softDelete(id: string, adminId: Types.ObjectId) {
		const coupon = await this.couponModel.findOneAndUpdate(
			{ _id: id, deletedAt: null },
			{ deletedAt: new Date(), deletedBy: adminId, isActive: false },
			{ returnDocument: 'after' },
		);
		if (!coupon) throw new NotFoundException('Coupon not found');
		return coupon;
	}

	async restore(id: string, adminId: Types.ObjectId) {
		const coupon = await this.couponModel.findOne({
			_id: id,
			deletedAt: { $ne: null },
		});
		if (!coupon) throw new NotFoundException('Deleted coupon not found');

		const clash = await this.couponModel.exists({
			code: coupon.code,
			deletedAt: null,
		});
		if (clash) throw new ConflictException('Another coupon uses this code');

		coupon.deletedAt = null as any;
		coupon.deletedBy = undefined;
		coupon.restoredAt = new Date();
		coupon.restoredBy = adminId;
		return coupon.save();
	}

	async validate(code: string, userId: Types.ObjectId, subtotal: number) {
		const now = new Date();

		const coupon = (await this.couponModel.findOne({
			code: code.trim().toUpperCase(),
			deletedAt: null,
			isActive: true,
			expire: { $gt: now },
			$or: [
				{ startsAt: { $exists: false } },
				{ startsAt: { $lte: now } },
			],
		})) as ICoupon;

		if (!coupon) throw new BadRequestException('Invalid or expired coupon');

		if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
			throw new BadRequestException(
				`Minimum order amount is ${coupon.minOrderAmount}`,
			);
		}
		if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
			throw new BadRequestException('Coupon usage limit reached');
		}
		if (coupon.usedBy.some((id) => id.equals(userId))) {
			throw new BadRequestException('You already used this coupon');
		}

		return { coupon, discount: this.calculateDiscount(coupon, subtotal) };
	}

	//* <------------- Helper -------------> *\\
	private calculateDiscount(coupon: ICoupon, subtotal: number): number {
		let discount =
			coupon.type === CouponType.PERCENTAGE
				? (subtotal * coupon.discount) / 100
				: coupon.discount;

		if (coupon.maxDiscount)
			discount = Math.min(discount, coupon.maxDiscount);
		return Math.min(Math.round(discount * 100) / 100, subtotal);
	}

	//* <---------- Check when create order (Atomic) ----------> *\\
	async redeem(couponId: Types.ObjectId, userId: Types.ObjectId) {
		const now = new Date();

		const updated = await this.couponModel.findOneAndUpdate(
			{
				_id: couponId,
				deletedAt: null,
				isActive: true,
				expire: { $gt: now },
				usedBy: { $ne: userId },
				$or: [
					{ usageLimit: { $exists: false } },
					{ $expr: { $lt: ['$usedCount', '$usageLimit'] } },
				],
			},
			{ $inc: { usedCount: 1 }, $push: { usedBy: userId } },
			{ returnDocument: 'after' },
		);

		if (!updated) {
			throw new BadRequestException('Coupon is no longer available');
		}
		return updated;
	}

	async release(couponId: Types.ObjectId, userId: Types.ObjectId) {
		await this.couponModel.updateOne(
			{ _id: couponId, usedBy: userId },
			{ $inc: { usedCount: -1 }, $pull: { usedBy: userId } },
		);
	}
}
