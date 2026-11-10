import { IsNumber, IsString, Length, Min } from 'class-validator';

export class ApplyCouponDto {
	@IsString()
	@Length(4, 6)
	code: string;

	@IsNumber()
	@Min(0)
	subtotal: number;
}
