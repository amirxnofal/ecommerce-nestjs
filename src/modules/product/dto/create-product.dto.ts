import { Type } from 'class-transformer';
import {
	IsArray,
	IsInt,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';

export class CreateProductDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(5)
	@MaxLength(50)
	name: string;

	@IsString()
	@IsOptional()
	description?: string;

	@Type(() => Number)
	@IsInt()
	@Min(0)
	@IsPositive()
	@IsOptional()
	stock?: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	originalPrice: number;

	@Type(() => Number)
	@IsNumber()
	@Min(0)
	@Max(100)
	@IsOptional()
	discountPercentage!: number;

	@IsOptional()
	salePrice: number;

	@IsMongoId()
	category: string;

	@IsMongoId()
	subCategory: string;

	@IsMongoId()
	brand: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	removeImages?: string[];
}
