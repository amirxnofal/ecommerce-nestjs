import {
	IsBoolean,
	IsDate,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../../../common/enums/coupon.enum.js';

export class CreateCouponDto {
	@IsString()
	@Length(4, 6)
	code: string;

	@IsEnum(CouponType)
	type: CouponType;

	@IsNumber()
	@Min(0)
	discount: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	maxDiscount?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	minOrderAmount?: number;

	@IsOptional()
	@Type(() => Date)
	@IsDate()
	startsAt?: Date;

	@Type(() => Date)
	@IsDate()
	expire: Date;

	@IsOptional()
	@IsNumber()
	@Min(1)
	usageLimit?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
