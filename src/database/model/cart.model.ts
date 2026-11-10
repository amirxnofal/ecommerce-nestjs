import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ICartItem } from '../../common/interfaces/cart.interface.js';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class CartItem {
	@Prop({ type: Types.ObjectId, ref: 'Product', required: true })
	product: Types.ObjectId;

	@Prop({ type: Number, required: true, min: 1 })
	quantity: number;
}

@Schema({ timestamps: true })
export class Cart {
	@Prop({ type: Types.ObjectId, ref: 'User', required: true })
	createdBy: Types.ObjectId;

	@Prop({ type: [CartItem], required: true })
	items: ICartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
export const CartModel = MongooseModule.forFeature([
	{
		name: Cart.name,
		schema: CartSchema,
	},
]);
