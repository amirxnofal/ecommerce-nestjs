import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
class ImageType {
	@Field(() => String) public_id: string;
	@Field(() => String) secure_url: string;
}

@ObjectType()
export class RefType {
	@Field(() => ID) _id: string;
	@Field(() => String) name: string;
	@Field(() => String) slug: string;
}

@ObjectType()
export class ProductType {
	@Field(() => ID) _id: string;
	@Field(() => String) productId: string;
	@Field(() => String) name: string;
	@Field(() => String, { nullable: true }) description?: string;
	@Field(() => String) slug: string;
	@Field(() => ImageType) image: ImageType;
	@Field(() => [ImageType]) gallery: ImageType[];
	@Field(() => Int) stock: number;
	@Field(() => Float) rating: number;
	@Field(() => Float) originalPrice: number;
	@Field(() => Float, { nullable: true }) discountPercentage?: number;
	@Field(() => Float, { nullable: true }) salePrice?: number;
	@Field(() => Float) finalPrice: number;
	@Field(() => RefType) category: RefType;
	@Field(() => RefType) subCategory: RefType;
	@Field(() => RefType) brand: RefType;
	@Field(() => Date, { nullable: true }) createdAt?: Date;
	@Field(() => Date, { nullable: true }) updatedAt?: Date;
}

@ObjectType()
export class PageMetaType {
	@Field(() => Int) total: number;
	@Field(() => Int) page: number;
	@Field(() => Int) limit: number;
	@Field(() => Int) pages: number;
}

@ObjectType()
export class ProductPagesType {
	@Field(() => [ProductType]) data: ProductType[];
	@Field(() => PageMetaType) meta: PageMetaType;
}
