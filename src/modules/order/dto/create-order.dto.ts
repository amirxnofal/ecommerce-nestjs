import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	Matches,
	MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateOrderDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(300)
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim() : value,
	)
	address: string;

	@Matches(/^01[0125][0-9]{8}$/, {
		message: 'phone must be a valid Egyptian mobile number',
	})
	phone: string;

	@IsEmail()
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toLowerCase() : value,
	)
	email: string;

	@IsOptional()
	@IsString()
	@Length(4, 6)
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toUpperCase() : value,
	)
	couponCode?: string;
}
 