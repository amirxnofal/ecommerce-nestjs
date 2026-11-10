import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType('ItemInput')
@ObjectType('ItemType')
export class ItemDTO {
	@Field(() => ID) product: string;
	@Field(() => Int) quantity: number;
}


@ObjectType()
export class CartDTO {
	@Field(() => ID) _id: string;
	@Field(() => String, { nullable: true }) createdBy?: string;
	@Field(() => [ItemDTO]) items: ItemDTO[];
	@Field(() => Date, { nullable: true }) createdAt?: Date;
	@Field(() => Date, { nullable: true }) updatedAt?: Date;
}
